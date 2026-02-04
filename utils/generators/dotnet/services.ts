
import { BackendConfig, VirtualFile } from '../../../types/index';

export const generatePermissionService = (config: BackendConfig, root: string): VirtualFile => {
  const isDbPerTenant = config.multiTenancy?.enabled && config.multiTenancy.strategy === 'database';

  let tenantInterface = `    public interface ITenantService
    {
        string? GetTenantId();
        string GetConnectionString(string originalConnectionString);
        bool IsDatabasePerTenant();
    }`;

  let tenantImplementation = `    public class TenantService : ITenantService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IConfiguration _config;

        public TenantService(IHttpContextAccessor httpContextAccessor, IConfiguration config)
        {
            _httpContextAccessor = httpContextAccessor;
            _config = config;
        }

        public bool IsDatabasePerTenant() => ${isDbPerTenant ? 'true' : 'false'};

        public string? GetTenantId()
        {
            var context = _httpContextAccessor.HttpContext;
            if (context == null) return null;

            if (context.Request.Headers.TryGetValue("X-Tenant-ID", out var tenantId))
            {
                return Sanitize(tenantId.ToString());
            }
            
            if (context.Request.Query.TryGetValue("tenantId", out var qTenantId))
            {
                return Sanitize(qTenantId.ToString());
            }

            return null; 
        }

        public string GetConnectionString(string originalConnectionString)
        {
            var tenantId = GetTenantId();
            if (string.IsNullOrEmpty(tenantId) || !IsDatabasePerTenant()) 
                return originalConnectionString;

            var builder = new System.Data.Common.DbConnectionStringBuilder();
            builder.ConnectionString = originalConnectionString;

            string[] dbKeys = new[] { "Database", "Initial Catalog", "Data Source" };
            
            foreach(var key in dbKeys)
            {
                if(builder.ContainsKey(key))
                {
                    var dbName = builder[key].ToString();
                    if(!dbName!.EndsWith($"_{tenantId}"))
                    {
                        if(key == "Data Source" && dbName.EndsWith(".db"))
                        {
                             builder[key] = dbName.Replace(".db", $"_{tenantId}.db");
                        }
                        else 
                        {
                             builder[key] = $"{dbName}_{tenantId}";
                        }
                    }
                    break;
                }
            }

            return builder.ConnectionString;
        }

        private string Sanitize(string input)
        {
            return System.Text.RegularExpressions.Regex.Replace(input, "[^a-zA-Z0-9_-]", "");
        }
    }`;

  const permissionContent = `using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ${config.projectName}.Data;
using ${config.projectName}.Models;

namespace ${config.projectName}.Services
{
${tenantInterface}

${tenantImplementation}

    public interface IPermissionService
    {
        Task<bool> CanReadTableAsync(ClaimsPrincipal user, string tableName);
        Task<bool> CanWriteTableAsync(ClaimsPrincipal user, string tableName);
        Task<bool> CanDeleteTableAsync(ClaimsPrincipal user, string tableName);
        Task<List<string>> GetBlockedFieldsAsync(ClaimsPrincipal user, string tableName);
    }

    public class PermissionService : IPermissionService
    {
        private readonly AppDbContext _context;

        public PermissionService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<bool> CanReadTableAsync(ClaimsPrincipal user, string tableName) => true;
        public async Task<bool> CanWriteTableAsync(ClaimsPrincipal user, string tableName) => true;
        public async Task<bool> CanDeleteTableAsync(ClaimsPrincipal user, string tableName) => true;

        public async Task<List<string>> GetBlockedFieldsAsync(ClaimsPrincipal user, string tableName)
        {
            return new List<string>();
        }
    }
}`;

  return { 
    name: 'PermissionService.cs', 
    path: `${root}/Services/PermissionService.cs`, 
    content: permissionContent, 
    language: 'csharp' 
  };
};
