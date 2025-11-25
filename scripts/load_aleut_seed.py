#!/usr/bin/env python3
"""
One-time loader for Aleut Federal seed data from `myScheduling Load.xlsx`.

What it does:
- Reads the "Data" sheet (employees, projects, hours).
- Creates tenant "Aleut Federal" (TenantStatus.Active).
- Seeds a platform+tenant admin (admin@admin.com) with a default password.
- Generates users for employees (email: first.last@aleutfederal.com), manager hierarchy, active/inactive flags.
- Creates Projects (by first segment of Project ID) and WBS elements (full Project ID as code).
- Creates Assignments per employee/WBS using min/max hours date.
- Creates an `actual_hours` table (if missing) and loads daily actuals for reporting.

Usage:
    python scripts/load_aleut_seed.py [--excel-path "myScheduling Load.xlsx"]

Notes:
- Uses the connection string from backend/src/MyScheduling.Api/appsettings.Development.json.
- Safe to re-run: upserts users/projects/wbs/assignments and de-dupes actuals by (user_id, wbs_element_id, work_date, hours).
- Default admin password: Admin@123 (bcrypt hashed). Change `ADMIN_PASSWORD` below if desired.
"""
import argparse
import datetime as dt
import json
import re
import sys
import uuid
from collections import defaultdict, Counter
from pathlib import Path

import pandas as pd
import psycopg2
import psycopg2.extras as extras
import bcrypt

ROOT = Path(__file__).resolve().parent.parent
APPSETTINGS = ROOT / "backend" / "src" / "MyScheduling.Api" / "appsettings.Development.json"
DEFAULT_EXCEL = ROOT / "myScheduling Load.xlsx"

ADMIN_EMAIL = "admin@admin.com"
ADMIN_DISPLAY = "Platform Admin"
ADMIN_PASSWORD = "Admin@123"  # change if needed
TENANT_NAME = "Aleut Federal"


def parse_conn_string(conn_str: str) -> dict:
    parts = {}
    for part in conn_str.split(";"):
        if not part.strip():
            continue
        if "=" not in part:
            continue
        k, v = part.split("=", 1)
        parts[k.strip().lower()] = v.strip()
    return {
        "host": parts.get("host"),
        "port": int(parts.get("port", 5432)),
        "dbname": parts.get("database"),
        "user": parts.get("username"),
        "password": parts.get("password"),
        "sslmode": parts.get("sslmode", "require").lower(),
    }


def load_connection():
    with open(APPSETTINGS, "r", encoding="utf-8") as f:
        data = json.load(f)
    conn_str = data["ConnectionStrings"]["DefaultConnection"]
    return parse_conn_string(conn_str)


def slug_email(first: str, last: str) -> str:
    clean_first = re.sub(r"[^a-z0-9]+", ".", first.lower()).strip(".")
    clean_last = re.sub(r"[^a-z0-9]+", ".", last.lower()).strip(".")
    base = f"{clean_first}.{clean_last}".strip(".")
    return f"{base}@aleutfederal.com"


def parse_name(raw: str):
    # Format like "Last, First (id)"
    raw = (raw or "").strip()
    raw = raw.split("(")[0].strip()
    if "," in raw:
        last, first = raw.split(",", 1)
        return first.strip(), last.strip()
    parts = raw.split()
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], " ".join(parts[1:])


def read_data(excel_path: Path):
    df = pd.read_excel(excel_path, sheet_name="Data")
    df.rename(columns=lambda c: c.strip().replace(" ", "_"), inplace=True)
    df["Hours_Date"] = pd.to_datetime(df["Hours_Date"]).dt.date
    df["Hire_date"] = pd.to_datetime(df["Hire_date"], errors="coerce").dt.date
    df["Termination_date"] = pd.to_datetime(df["Termination_date"], errors="coerce").dt.date
    return df


def build_models(df: pd.DataFrame):
    employees = {}
    email_counts = Counter()
    projects = {}
    wbs_map = {}
    assignments = {}
    actuals = []

    for row in df.itertuples(index=False):
        emp_id = int(row.Employee_Id)
        emp_name = row.Employee_Name
        mgr_id = row.Manager_ID
        mgr_id = int(mgr_id) if pd.notna(mgr_id) else None
        active_flag = str(row.Active_Flag).strip().upper()
        business_unit = row.Business_Unit
        hire_date = row.Hire_date
        term_date = row.Termination_date
        proj_id_raw = str(row.Project_ID).strip()
        proj_name = str(row.Project_Name).strip()
        hours_date = row.Hours_Date
        entered_hours = float(row.Entered_Hours)
        pay_type = row.Pay_Type
        pay_type_name = row.Pay_Type_Name

        # Build employee
        if emp_id not in employees:
            first, last = parse_name(emp_name)
            email = slug_email(first, last)
            email_counts[email] += 1
            if email_counts[email] > 1:
                email = slug_email(first, f"{last}.{emp_id}")
            employees[emp_id] = {
                "first": first,
                "last": last,
                "display_name": f"{first} {last}".strip(),
                "email": email,
                "active": active_flag == "Y",
                "department": business_unit,
                "hire_date": hire_date if pd.notna(hire_date) else None,
                "termination_date": term_date if pd.notna(term_date) else None,
                "manager_emp_id": mgr_id,
            }

        # Project + WBS
        project_code = proj_id_raw.split(".")[0]
        if project_code not in projects:
            projects[project_code] = {
                "program_code": project_code,
                "name": proj_name,
                "start": hours_date,
                "end": hours_date,
            }
        else:
            projects[project_code]["start"] = min(projects[project_code]["start"], hours_date)
            projects[project_code]["end"] = max(projects[project_code]["end"], hours_date)

        if proj_id_raw not in wbs_map:
            wbs_map[proj_id_raw] = {
                "project_code": project_code,
                "code": proj_id_raw,
                "description": proj_name,
                "start": hours_date,
                "end": hours_date,
            }
        else:
            wbs_map[proj_id_raw]["start"] = min(wbs_map[proj_id_raw]["start"], hours_date)
            wbs_map[proj_id_raw]["end"] = max(wbs_map[proj_id_raw]["end"], hours_date)

        # Assignments (per employee + WBS)
        assign_key = (emp_id, proj_id_raw)
        if assign_key not in assignments:
            assignments[assign_key] = {
                "start": hours_date,
                "end": hours_date,
                "total_hours": entered_hours,
            }
        else:
            assignments[assign_key]["start"] = min(assignments[assign_key]["start"], hours_date)
            assignments[assign_key]["end"] = max(assignments[assign_key]["end"], hours_date)
            assignments[assign_key]["total_hours"] += entered_hours

        # Actuals (for reporting)
        actuals.append(
            {
                "emp_id": emp_id,
                "project_code": project_code,
                "wbs_code": proj_id_raw,
                "project_name": proj_name,
                "work_date": hours_date,
                "hours": entered_hours,
                "pay_type": pay_type,
                "pay_type_name": pay_type_name,
                "business_unit": business_unit,
            }
        )

    # Make Geoff Vaughan the top manager (no manager)
    for emp_id, data in employees.items():
        if data["last"].lower().startswith("vaughan") and data["first"].lower().startswith("geoff"):
            employees[emp_id]["manager_emp_id"] = None
    return employees, projects, wbs_map, assignments, actuals


def ensure_actual_hours_table(cur):
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS actual_hours (
            id uuid PRIMARY KEY,
            tenant_id uuid NOT NULL,
            user_id uuid NOT NULL,
            wbs_element_id uuid NOT NULL,
            work_date date NOT NULL,
            hours numeric(10,2) NOT NULL,
            pay_type text,
            pay_type_name text,
            business_unit text,
            project_code text,
            project_name text,
            created_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS idx_actual_hours_user_date ON actual_hours(user_id, work_date);
        CREATE INDEX IF NOT EXISTS idx_actual_hours_wbs_date ON actual_hours(wbs_element_id, work_date);
        CREATE UNIQUE INDEX IF NOT EXISTS ux_actual_hours_unique
            ON actual_hours(user_id, wbs_element_id, work_date, hours, pay_type, pay_type_name);
        """
    )


def upsert_tenant(cur, tenant_name: str) -> uuid.UUID:
    cur.execute("SELECT id FROM tenants WHERE name=%s LIMIT 1", (tenant_name,))
    row = cur.fetchone()
    if row:
        return row[0]
    tenant_id = uuid.uuid4()
    now = dt.datetime.utcnow()
    cur.execute(
        """
        INSERT INTO tenants (id, name, status, created_at, is_deleted)
        VALUES (%s, %s, %s, %s, false)
        """,
        (tenant_id, tenant_name, 0, now),
    )
    return tenant_id


def upsert_user(cur, user):
    cur.execute(
        """
        INSERT INTO users (
            id, entra_object_id, email, display_name, password_hash, is_system_admin,
            is_active, last_login_at, deactivated_at, deactivated_by_user_id,
            password_changed_at, failed_login_attempts, locked_out_until,
            phone_number, job_title, department, profile_photo_url,
            org_unit, location, labor_category, cost_center,
            type, status, manager_id, tenant_id,
            created_at, updated_at, created_by_user_id, updated_by_user_id,
            is_deleted
        )
        VALUES (
            %(id)s, %(entra)s, %(email)s, %(display)s, %(pwd)s, %(is_sys)s,
            %(active)s, NULL, %(deactivated_at)s, NULL,
            NULL, 0, NULL,
            NULL, %(job_title)s, %(department)s, NULL,
            %(org_unit)s, %(location)s, %(labor_category)s, %(cost_center)s,
            %(type)s, %(status)s, NULL, %(tenant_id)s,
            %(now)s, %(now)s, NULL, NULL,
            false
        )
        ON CONFLICT (email)
        DO UPDATE SET
            display_name = EXCLUDED.display_name,
            is_active = EXCLUDED.is_active,
            status = EXCLUDED.status,
            department = EXCLUDED.department,
            org_unit = EXCLUDED.org_unit,
            tenant_id = EXCLUDED.tenant_id,
            updated_at = EXCLUDED.updated_at
        RETURNING id;
        """,
        user,
    )
    return cur.fetchone()[0]


def upsert_membership(cur, membership):
    cur.execute(
        """
        INSERT INTO tenant_memberships (
            id, user_id, tenant_id, roles, is_active, joined_at,
            created_at, updated_at, is_deleted
        )
        VALUES (
            %(id)s, %(user_id)s, %(tenant_id)s, %(roles)s, %(active)s, %(joined)s,
            %(now)s, %(now)s, false
        )
        ON CONFLICT (user_id, tenant_id)
        DO UPDATE SET roles = EXCLUDED.roles, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;
        """,
        membership,
    )


def upsert_project(cur, project, tenant_id):
    cur.execute(
        "SELECT id FROM projects WHERE tenant_id=%s AND program_code=%s LIMIT 1",
        (tenant_id, project["program_code"]),
    )
    row = cur.fetchone()
    if row:
        return row[0]
    pid = uuid.uuid4()
    cur.execute(
        """
        INSERT INTO projects (
            id, tenant_id, name, program_code, customer, start_date, end_date, status,
            created_at, updated_at, is_deleted
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,false)
        RETURNING id;
        """,
        (
            pid,
            tenant_id,
            project["name"],
            project["program_code"],
            None,
            project["start"],
            project["end"],
            1,  # Active
            dt.datetime.utcnow(),
            dt.datetime.utcnow(),
        ),
    )
    return cur.fetchone()[0]


def upsert_wbs(cur, wbs, tenant_id, project_id):
    cur.execute(
        "SELECT id FROM wbs_elements WHERE tenant_id=%s AND code=%s LIMIT 1",
        (tenant_id, wbs["code"]),
    )
    row = cur.fetchone()
    if row:
        return row[0]
    wid = uuid.uuid4()
    cur.execute(
        """
        INSERT INTO wbs_elements (
            id, tenant_id, project_id, code, description,
            valid_from, valid_to, start_date, end_date,
            type, status, is_billable,
            owner_user_id, approver_user_id, approval_status, approval_notes, approved_at,
            owner_id, approver_id,
            created_at, updated_at, is_deleted
        )
        VALUES (
            %s,%s,%s,%s,%s,
            %s,%s,%s,%s,
            %s,%s,%s,
            NULL,NULL,%s,NULL,NULL,
            NULL,NULL,
            %s,%s,false
        )
        RETURNING id;
        """,
        (
            wid,
            tenant_id,
            project_id,
            wbs["code"][:100],
            wbs["description"][:500],
            wbs["start"],
            wbs["end"],
            wbs["start"],
            wbs["end"],
            0,  # Billable
            1,  # Active
            True,
            2,  # approval_status = Approved
            dt.datetime.utcnow(),
            dt.datetime.utcnow(),
        ),
    )
    return cur.fetchone()[0]


def load_existing_assignments(cur, tenant_id):
    cur.execute(
        "SELECT user_id, wbs_element_id FROM assignments WHERE tenant_id=%s",
        (tenant_id,),
    )
    return {(r[0], r[1]) for r in cur.fetchall()}


def insert_assignments(cur, tenant_id, assignment_rows):
    if not assignment_rows:
        return
    extras.execute_values(
        cur,
        """
        INSERT INTO assignments (
            id, tenant_id, user_id, project_role_id, wbs_element_id,
            allocation_pct, start_date, end_date, status,
            is_pto_or_training, approved_by_user_id, approved_at,
            created_at, updated_at, is_deleted
        )
        VALUES %s
        """,
        assignment_rows,
        page_size=500,
    )


def insert_actuals(cur, rows):
    if not rows:
        return
    extras.execute_values(
        cur,
        """
        INSERT INTO actual_hours (
            id, tenant_id, user_id, wbs_element_id, work_date, hours,
            pay_type, pay_type_name, business_unit, project_code, project_name, created_at
        )
        VALUES %s
        ON CONFLICT DO NOTHING
        """,
        rows,
        page_size=2000,
    )


def main(excel_path: Path):
    if not excel_path.exists():
        sys.exit(f"Excel file not found: {excel_path}")

    print(f"Reading data from {excel_path} ...")
    df = read_data(excel_path)
    employees, projects, wbs_map, assignments, actuals = build_models(df)

    print(f"Employees: {len(employees)}, Projects: {len(projects)}, WBS: {len(wbs_map)}, Assignments: {len(assignments)}, Actual rows: {len(actuals)}")

    conn_params = load_connection()
    conn = psycopg2.connect(**conn_params)
    conn.autocommit = False
    extras.register_uuid()
    try:
        with conn.cursor() as cur:
            ensure_actual_hours_table(cur)

            tenant_id = upsert_tenant(cur, TENANT_NAME)
            now = dt.datetime.utcnow()

            # Admin user (platform + tenant admin)
            admin_pwd_hash = bcrypt.hashpw(ADMIN_PASSWORD.encode(), bcrypt.gensalt()).decode()
            admin_user = {
                "id": uuid.uuid4(),
                "entra": str(uuid.uuid4()),
                "email": ADMIN_EMAIL,
                "display": ADMIN_DISPLAY,
                "pwd": admin_pwd_hash,
                "is_sys": True,
                "active": True,
                "deactivated_at": None,
                "job_title": "Platform Admin",
                "department": "Admin",
                "org_unit": "Admin",
                "location": None,
                "labor_category": None,
                "cost_center": None,
                "type": 0,
                "status": 0,
                "tenant_id": tenant_id,
                "now": now,
            }
            admin_id = upsert_user(cur, admin_user)
            upsert_membership(
                cur,
                {
                    "id": uuid.uuid4(),
                    "user_id": admin_id,
                    "tenant_id": tenant_id,
                    "roles": extras.Json([0, 6, 4, 5, 2, 7, 8]),  # Employee, TenantAdmin, ResourceManager, OfficeManager, ProjectManager, Executive, OverrideApprover
                    "active": True,
                    "joined": now,
                    "now": now,
                },
            )

            # Build/Upsert all users
            user_ids = {}
            for emp_id, data in employees.items():
                active = bool(data["active"])
                status = 0 if active else 1
                user_payload = {
                    "id": uuid.uuid4(),
                    "entra": str(uuid.uuid4()),
                    "email": data["email"],
                    "display": data["display_name"],
                    "pwd": None,
                    "is_sys": False,
                    "active": active,
                    "deactivated_at": data["termination_date"] if not active else None,
                    "job_title": None,
                    "department": data["department"],
                    "org_unit": data["department"],
                    "location": None,
                    "labor_category": None,
                    "cost_center": None,
                    "type": 0,  # Employee
                    "status": status,
                    "tenant_id": tenant_id,
                    "now": now,
                }
                uid = upsert_user(cur, user_payload)
                user_ids[emp_id] = uid
                upsert_membership(
                    cur,
                    {
                        "id": uuid.uuid4(),
                        "user_id": uid,
                        "tenant_id": tenant_id,
                        "roles": extras.Json([0]),  # Employee
                        "active": active,
                        "joined": now,
                        "now": now,
                    },
                )

            # Manager relationships
            for emp_id, data in employees.items():
                mgr_emp = data["manager_emp_id"]
                if mgr_emp and mgr_emp in user_ids:
                    cur.execute(
                        "UPDATE users SET manager_id=%s WHERE id=%s",
                        (user_ids[mgr_emp], user_ids[emp_id]),
                    )
                elif not mgr_emp:
                    cur.execute(
                        "UPDATE users SET manager_id=NULL WHERE id=%s",
                        (user_ids[emp_id],),
                    )

            # Projects and WBS
            project_ids = {}
            for code, p in projects.items():
                project_ids[code] = upsert_project(cur, p, tenant_id)

            wbs_ids = {}
            for code, w in wbs_map.items():
                proj_id = project_ids[w["project_code"]]
                wbs_ids[code] = upsert_wbs(cur, w, tenant_id, proj_id)

            # Assignments (de-dupe against existing)
            existing_assignments = load_existing_assignments(cur, tenant_id)
            assignment_rows = []
            for (emp_id, wbs_code), agg in assignments.items():
                uid = user_ids.get(emp_id)
                wid = wbs_ids.get(wbs_code)
                if not uid or not wid:
                    continue
                if (uid, wid) in existing_assignments:
                    continue
                assignment_rows.append(
                    (
                        uuid.uuid4(),
                        tenant_id,
                        uid,
                        None,  # project_role_id
                        wid,
                        100,  # allocation_pct
                        agg["start"],
                        agg["end"],
                        3,  # Active
                        False,
                        None,
                        None,
                        now,
                        now,
                        False,
                    )
                )
            insert_assignments(cur, tenant_id, assignment_rows)

            # Actual hours
            actual_rows = []
            for rec in actuals:
                uid = user_ids.get(rec["emp_id"])
                wid = wbs_ids.get(rec["wbs_code"])
                if not uid or not wid:
                    continue
                actual_rows.append(
                    (
                        uuid.uuid4(),
                        tenant_id,
                        uid,
                        wid,
                        rec["work_date"],
                        rec["hours"],
                        rec["pay_type"],
                        rec["pay_type_name"],
                        rec["business_unit"],
                        rec["project_code"],
                        rec["project_name"],
                        now,
                    )
                )
            insert_actuals(cur, actual_rows)

        conn.commit()
        print("Data load complete.")
    except Exception as exc:
        conn.rollback()
        print(f"Error, rolled back: {exc}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Load Aleut Federal seed data from Excel.")
    parser.add_argument("--excel-path", type=Path, default=DEFAULT_EXCEL, help="Path to Excel file (default: myScheduling Load.xlsx)")
    args = parser.parse_args()
    main(args.excel_path)
