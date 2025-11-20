using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyScheduling.Core.Entities;

[Table("user_invitations")]
public class UserInvitation
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Required]
    [Column("email")]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [Column("tenant_id")]
    public Guid TenantId { get; set; }

    [ForeignKey(nameof(TenantId))]
    public Tenant? Tenant { get; set; }

    [Required]
    [Column("roles")]
    public List<AppRole> Roles { get; set; } = new();

    [Required]
    [Column("invitation_token")]
    [MaxLength(255)]
    public string InvitationToken { get; set; } = string.Empty;

    [Required]
    [Column("status")]
    public int Status { get; set; } // 0 = Pending, 1 = Accepted, 2 = Cancelled, 3 = Expired

    [Required]
    [Column("expires_at")]
    public DateTime ExpiresAt { get; set; }

    [Column("accepted_at")]
    public DateTime? AcceptedAt { get; set; }

    [Column("created_by_user_id")]
    public Guid? CreatedByUserId { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
