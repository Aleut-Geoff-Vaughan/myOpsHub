import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { HelpCircle, ExternalLink, X } from 'lucide-react';
import {
  CustomFieldType,
  type CustomFieldDefinition,
  type CustomFieldValue,
  type SetCustomFieldValueDto,
} from '../../services/salesOpsService';
import { useCustomFieldDefinitions, useCustomFieldValues, useSetCustomFieldValues } from '../../hooks/useSalesOps';

// Get value from CustomFieldValue based on field type
function getFieldValue(value: CustomFieldValue | undefined, fieldType: CustomFieldType): string | number | boolean | null {
  if (!value) return null;
  switch (fieldType) {
    case CustomFieldType.Text:
    case CustomFieldType.TextArea:
    case CustomFieldType.Url:
    case CustomFieldType.Email:
    case CustomFieldType.Phone:
      return value.textValue ?? null;
    case CustomFieldType.Number:
    case CustomFieldType.Currency:
    case CustomFieldType.Percent:
      return value.numberValue ?? null;
    case CustomFieldType.Date:
    case CustomFieldType.DateTime:
      return value.dateValue ?? null;
    case CustomFieldType.Checkbox:
      return value.boolValue ?? false;
    case CustomFieldType.Picklist:
    case CustomFieldType.MultiPicklist:
      return value.picklistValue ?? null;
    case CustomFieldType.Lookup:
      return value.lookupValue ?? null;
    default:
      return value.textValue ?? null;
  }
}

// Create SetCustomFieldValueDto from form value
function createFieldValueDto(
  definition: CustomFieldDefinition,
  _entityId: string,
  value: string | number | boolean | null
): SetCustomFieldValueDto {
  const base: SetCustomFieldValueDto = {
    fieldDefinitionId: definition.id,
  };

  switch (definition.fieldType) {
    case CustomFieldType.Text:
    case CustomFieldType.TextArea:
    case CustomFieldType.Url:
    case CustomFieldType.Email:
    case CustomFieldType.Phone:
      return { ...base, textValue: value as string | undefined };
    case CustomFieldType.Number:
    case CustomFieldType.Currency:
    case CustomFieldType.Percent:
      return { ...base, numberValue: typeof value === 'number' ? value : (parseFloat(value as string) || undefined) };
    case CustomFieldType.Date:
    case CustomFieldType.DateTime:
      return { ...base, dateValue: value as string | undefined };
    case CustomFieldType.Checkbox:
      return { ...base, boolValue: value as boolean | undefined };
    case CustomFieldType.Picklist:
    case CustomFieldType.MultiPicklist:
      return { ...base, picklistValue: value as string | undefined };
    case CustomFieldType.Lookup:
      return { ...base, lookupValue: value as string | undefined };
    default:
      return { ...base, textValue: value as string | undefined };
  }
}

// Individual field input component
interface FieldInputProps {
  definition: CustomFieldDefinition;
  value: string | number | boolean | null;
  onChange: (value: string | number | boolean | null) => void;
  disabled?: boolean;
  error?: string;
}

function FieldInput({ definition, value, onChange, disabled, error }: FieldInputProps) {
  const inputClasses = `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
    error ? 'border-red-300' : 'border-gray-300'
  }`;

  const parsePicklistOptions = (json?: string): string[] => {
    if (!json) return [];
    try {
      return JSON.parse(json);
    } catch {
      return [];
    }
  };

  const fieldId = `custom-field-${definition.fieldName}`;

  switch (definition.fieldType) {
    case CustomFieldType.Text:
      return (
        <input
          id={fieldId}
          type="text"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
          className={inputClasses}
          placeholder={definition.helpText}
        />
      );

    case CustomFieldType.TextArea:
      return (
        <textarea
          id={fieldId}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
          rows={3}
          className={inputClasses}
          placeholder={definition.helpText}
        />
      );

    case CustomFieldType.Number:
      return (
        <input
          id={fieldId}
          type="number"
          value={value !== null && value !== false ? String(value) : ''}
          onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
          disabled={disabled}
          className={inputClasses}
          placeholder={definition.helpText}
        />
      );

    case CustomFieldType.Currency:
      return (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <input
            id={fieldId}
            type="number"
            step="0.01"
            value={value !== null && value !== false ? String(value) : ''}
            onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
            disabled={disabled}
            className={`${inputClasses} pl-7`}
            placeholder="0.00"
          />
        </div>
      );

    case CustomFieldType.Percent:
      return (
        <div className="relative">
          <input
            id={fieldId}
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={value !== null && value !== false ? String(value) : ''}
            onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
            disabled={disabled}
            className={`${inputClasses} pr-8`}
            placeholder="0"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
        </div>
      );

    case CustomFieldType.Date:
      return (
        <input
          id={fieldId}
          type="date"
          value={value ? (value as string).substring(0, 10) : ''}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
          className={inputClasses}
        />
      );

    case CustomFieldType.DateTime:
      return (
        <input
          id={fieldId}
          type="datetime-local"
          value={value ? (value as string).substring(0, 16) : ''}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
          className={inputClasses}
        />
      );

    case CustomFieldType.Checkbox:
      return (
        <div className="flex items-center gap-2 py-2">
          <input
            id={fieldId}
            type="checkbox"
            checked={(value as boolean) ?? false}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
          />
          {definition.helpText && (
            <span className="text-sm text-gray-500">{definition.helpText}</span>
          )}
        </div>
      );

    case CustomFieldType.Picklist: {
      const options = parsePicklistOptions(definition.picklistOptions);
      return (
        <select
          id={fieldId}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
          className={inputClasses}
        >
          <option value="">Select...</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    case CustomFieldType.MultiPicklist: {
      const options = parsePicklistOptions(definition.picklistOptions);
      const selectedValues: string[] = value ? JSON.parse(value as string) : [];
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1 min-h-[38px] p-2 border border-gray-300 rounded-lg bg-white">
            {selectedValues.length === 0 ? (
              <span className="text-gray-400 text-sm">Select options...</span>
            ) : (
              selectedValues.map((val) => (
                <span
                  key={val}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm"
                >
                  {val}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => {
                        const newValues = selectedValues.filter((v) => v !== val);
                        onChange(newValues.length ? JSON.stringify(newValues) : null);
                      }}
                      className="hover:text-orange-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))
            )}
          </div>
          <select
            id={fieldId}
            value=""
            onChange={(e) => {
              if (e.target.value && !selectedValues.includes(e.target.value)) {
                const newValues = [...selectedValues, e.target.value];
                onChange(JSON.stringify(newValues));
              }
            }}
            disabled={disabled}
            className={inputClasses}
          >
            <option value="">Add option...</option>
            {options
              .filter((opt) => !selectedValues.includes(opt))
              .map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
          </select>
        </div>
      );
    }

    case CustomFieldType.Url:
      return (
        <div className="flex gap-2">
          <input
            id={fieldId}
            type="url"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value || null)}
            disabled={disabled}
            className={inputClasses}
            placeholder="https://..."
          />
          {value && (
            <a
              href={value as string}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ExternalLink className="h-5 w-5 text-gray-500" />
            </a>
          )}
        </div>
      );

    case CustomFieldType.Email:
      return (
        <input
          id={fieldId}
          type="email"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
          className={inputClasses}
          placeholder="email@example.com"
        />
      );

    case CustomFieldType.Phone:
      return (
        <input
          id={fieldId}
          type="tel"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
          className={inputClasses}
          placeholder="(555) 123-4567"
        />
      );

    case CustomFieldType.Lookup:
      // For now, render as a text input for the ID
      // TODO: Implement lookup component with search
      return (
        <input
          id={fieldId}
          type="text"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
          className={inputClasses}
          placeholder={`Enter ${definition.lookupEntityType} ID...`}
        />
      );

    default:
      return (
        <input
          id={fieldId}
          type="text"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
          className={inputClasses}
        />
      );
  }
}

// Display value component (for read-only views)
interface FieldDisplayProps {
  definition: CustomFieldDefinition;
  value: string | number | boolean | null;
}

export function CustomFieldDisplay({ definition, value }: FieldDisplayProps) {
  if (value === null || value === undefined) {
    return <span className="text-gray-400">-</span>;
  }

  switch (definition.fieldType) {
    case CustomFieldType.Checkbox:
      return <span>{value ? 'Yes' : 'No'}</span>;

    case CustomFieldType.Currency:
      return <span>${(value as number).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>;

    case CustomFieldType.Percent:
      return <span>{value}%</span>;

    case CustomFieldType.Date:
      return <span>{format(new Date(value as string), 'MMM d, yyyy')}</span>;

    case CustomFieldType.DateTime:
      return <span>{format(new Date(value as string), 'MMM d, yyyy h:mm a')}</span>;

    case CustomFieldType.MultiPicklist: {
      // Parse the JSON outside of JSX to avoid try/catch around JSX
      let parsedValues: string[] | null = null;
      try {
        parsedValues = JSON.parse(value as string) as string[];
      } catch {
        // Invalid JSON, fall through to render as plain string
      }
      if (parsedValues && Array.isArray(parsedValues)) {
        return (
          <div className="flex flex-wrap gap-1">
            {parsedValues.map((v) => (
              <span key={v} className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-sm">
                {v}
              </span>
            ))}
          </div>
        );
      }
      return <span>{value as string}</span>;
    }

    case CustomFieldType.Url:
      return (
        <a
          href={value as string}
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-600 hover:text-orange-700 flex items-center gap-1"
        >
          {value as string}
          <ExternalLink className="h-3 w-3" />
        </a>
      );

    case CustomFieldType.Email:
      return (
        <a href={`mailto:${value}`} className="text-orange-600 hover:text-orange-700">
          {value as string}
        </a>
      );

    case CustomFieldType.Phone:
      return (
        <a href={`tel:${value}`} className="text-orange-600 hover:text-orange-700">
          {value as string}
        </a>
      );

    default:
      return <span>{String(value)}</span>;
  }
}

// Field wrapper with label
interface FieldWrapperProps {
  definition: CustomFieldDefinition;
  children: React.ReactNode;
  error?: string;
}

function FieldWrapper({ definition, children, error }: FieldWrapperProps) {
  const fieldId = `custom-field-${definition.fieldName}`;
  return (
    <div>
      <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">
        {definition.displayLabel}
        {definition.isRequired && <span className="text-red-500 ml-1">*</span>}
        {definition.helpText && definition.fieldType !== CustomFieldType.Checkbox && (
          <span className="ml-1 text-gray-400" title={definition.helpText}>
            <HelpCircle className="h-3 w-3 inline" />
          </span>
        )}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

// Main component for rendering a section of custom fields
interface CustomFieldsSectionProps {
  entityType: string;
  entityId: string;
  section?: string; // If not provided, renders all sections
  mode: 'edit' | 'view';
  onValuesChange?: (values: Record<string, SetCustomFieldValueDto>) => void;
  localValues?: Record<string, string | number | boolean | null>; // For controlled forms
}

export function CustomFieldsSection({
  entityType,
  entityId,
  section,
  mode,
  onValuesChange,
  localValues,
}: CustomFieldsSectionProps) {
  const [pendingValues, setPendingValues] = useState<Record<string, string | number | boolean | null>>({});

  const { data: definitions, isLoading: loadingDefs } = useCustomFieldDefinitions({
    entityType,
    includeInactive: false,
  });

  const { data: values, isLoading: loadingValues } = useCustomFieldValues(entityType, entityId);

  // Filter definitions by section if provided
  const filteredDefs = definitions?.filter((d) => (section ? d.section === section : true)) ?? [];

  // Group by section
  const sections = filteredDefs.reduce(
    (acc, def) => {
      const sec = def.section || 'Additional Information';
      if (!acc[sec]) acc[sec] = [];
      acc[sec].push(def);
      return acc;
    },
    {} as Record<string, CustomFieldDefinition[]>
  );

  // Get value for a field
  const getValueForField = (def: CustomFieldDefinition): string | number | boolean | null => {
    // Check local values first (for controlled forms)
    if (localValues && def.fieldName in localValues) {
      return localValues[def.fieldName];
    }
    // Check pending values
    if (def.fieldName in pendingValues) {
      return pendingValues[def.fieldName];
    }
    // Get from loaded values
    const fieldValue = values?.find((v) => v.fieldDefinitionId === def.id);
    return getFieldValue(fieldValue, def.fieldType);
  };

  // Handle value change
  const handleValueChange = (def: CustomFieldDefinition, value: string | number | boolean | null) => {
    const newPending = { ...pendingValues, [def.fieldName]: value };
    setPendingValues(newPending);

    if (onValuesChange) {
      const dtos: Record<string, SetCustomFieldValueDto> = {};
      for (const fieldName of Object.keys(newPending)) {
        const fieldDef = definitions?.find((d) => d.fieldName === fieldName);
        if (fieldDef) {
          dtos[fieldName] = createFieldValueDto(fieldDef, entityId, newPending[fieldName]);
        }
      }
      onValuesChange(dtos);
    }
  };

  if (loadingDefs || loadingValues) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (filteredDefs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {Object.entries(sections).map(([sectionName, sectionDefs]) => (
        <div key={sectionName} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">{sectionName}</h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sectionDefs.map((def) => (
                <FieldWrapper key={def.id} definition={def}>
                  {mode === 'edit' ? (
                    <FieldInput
                      definition={def}
                      value={getValueForField(def)}
                      onChange={(v) => handleValueChange(def, v)}
                    />
                  ) : (
                    <div className="py-2 text-gray-900">
                      <CustomFieldDisplay definition={def} value={getValueForField(def)} />
                    </div>
                  )}
                </FieldWrapper>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Hook for using custom fields in forms
// eslint-disable-next-line react-refresh/only-export-components
export function useCustomFieldsForm(entityType: string, entityId: string) {
  const { data: definitions } = useCustomFieldDefinitions({ entityType, includeInactive: false });
  const { data: values, isLoading } = useCustomFieldValues(entityType, entityId);
  const setValuesMutation = useSetCustomFieldValues();

  const [formValues, setFormValues] = useState<Record<string, string | number | boolean | null>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Initialize form values from loaded data
  useEffect(() => {
    if (!values || !definitions) return;

    const initial: Record<string, string | number | boolean | null> = {};
    for (const def of definitions) {
      const val = values.find((v) => v.fieldDefinitionId === def.id);
      initial[def.fieldName] = getFieldValue(val, def.fieldType);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormValues(initial);
  }, [values, definitions]);

  const setValue = (fieldName: string, value: string | number | boolean | null) => {
    setFormValues((prev) => ({ ...prev, [fieldName]: value }));
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
  };

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!definitions) return errors;

    for (const def of definitions) {
      if (def.isRequired) {
        const val = formValues[def.fieldName];
        if (val === null || val === undefined || val === '') {
          errors[def.fieldName] = `${def.displayLabel} is required`;
        }
      }
    }
    return errors;
  };

  const save = async () => {
    if (!definitions) return;

    const dtos: SetCustomFieldValueDto[] = [];
    for (const def of definitions) {
      if (def.fieldName in formValues) {
        dtos.push(createFieldValueDto(def, entityId, formValues[def.fieldName]));
      }
    }

    await setValuesMutation.mutateAsync({ entityType, entityId, values: dtos });
  };

  return {
    formValues,
    setValue,
    validate,
    save,
    isLoading,
    isSaving: setValuesMutation.isPending,
    touched,
    definitions: definitions ?? [],
  };
}

export default CustomFieldsSection;
