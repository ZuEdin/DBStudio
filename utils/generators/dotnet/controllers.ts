
import { Table, Relationship, BackendConfig, VirtualFile, Query } from '../../../types/index';
import { resolveType, toPascalCase } from '../common';

export const generateControllers = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig, root: string): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const useAuth = config.authConfig?.useUserLogin;
  
  // --- Auth Controller ---
  if (useAuth) {
      const authControllerContent = `using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ${config.projectName}.Data;
using ${config.projectName}.Models;

namespace ${config.projectName}.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            var user = await _context.SysUsers.FirstOrDefaultAsync(u => u.Username == model.Username);
            
            // Note: In production, verify hashed passwords!
            if (user == null || user.PasswordHash != model.Password) 
                return Unauthorized(new { message = "Invalid credentials" });

            // Generate JWT
            var tokenHandler = new JwtSecurityTokenHandler();
            // Use a secure key in production (env variable)
            var key = Encoding.ASCII.GetBytes("THIS_IS_A_VERY_LONG_SECRET_KEY_FOR_DEMO_PURPOSES_ONLY_PLEASE_CHANGE");
            
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[] 
                { 
                    new Claim(ClaimTypes.Name, user.Username),
                    new Claim(ClaimTypes.Role, user.Role ?? "User"),
                    new Claim("id", user.Id.ToString())
                }),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return Ok(new { token = tokenHandler.WriteToken(token), username = user.Username, role = user.Role });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterModel model)
        {
            if (await _context.SysUsers.AnyAsync(u => u.Username == model.Username))
                return BadRequest("User already exists");

            var user = new SysUser 
            { 
                Username = model.Username, 
                Email = model.Email,
                PasswordHash = model.Password, // TODO: Hash this!
                Role = "User" 
            };

            _context.SysUsers.Add(user);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Registration successful" });
        }
    }

    public class LoginModel { public string Username { get; set; } public string Password { get; set; } }
    public class RegisterModel { public string Username { get; set; } public string Email { get; set; } public string Password { get; set; } }
}`;
      files.push({ name: 'AuthController.cs', path: `${root}/Controllers/AuthController.cs`, content: authControllerContent, language: 'csharp' });
  }

  // --- AD Controller (if Windows Auth) ---
  if (config.authConfig?.useWindowsAuth) {
       // ... existing AD Controller code ...
       const adControllerContent = `using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ${config.projectName}.Services;

namespace ${config.projectName}.Controllers
{
    [Route("api/ad")]
    [ApiController]
    [Authorize]
    public class AdController : ControllerBase
    {
        private readonly IAdService _adService;
        private readonly ICurrentUserService _currentUser;

        public AdController(IAdService adService, ICurrentUserService currentUser)
        {
            _adService = adService;
            _currentUser = currentUser;
        }

        [HttpGet("me")]
        public ActionResult<AdUserInfo> GetMe()
        {
            var info = _adService.GetCurrentUserDetails(User);
            if (info == null) return NotFound();
            return Ok(info);
        }

        [HttpGet("search")]
        public ActionResult<List<AdUserInfo>> Search([FromQuery] string? q = null)
        {
            if (string.IsNullOrWhiteSpace(q) || q.Length < 2) return BadRequest("Query too short.");
            return Ok(_adService.SearchUsers(q));
        }
    }
}`;
       files.push({ name: 'AdController.cs', path: `${root}/Controllers/AdController.cs`, content: adControllerContent, language: 'csharp' });
  }

  // Generic CRUD Controllers with Audit (Existing)
  const pagedResultClass = `namespace ${config.projectName}.Models { public class PagedResult<T> { public IEnumerable<T> Data { get; set; } = new List<T>(); public int Total { get; set; } public int Page { get; set; } public int PageSize { get; set; } public int TotalPages { get; set; } } }`;
  files.push({ name: 'PagedResult.cs', path: `${root}/Models/PagedResult.cs`, content: pagedResultClass, language: 'csharp' });

  tables.forEach(table => {
      const safeName = toPascalCase(table.name);
      const pkField = table.fields.find(f => f.isPrimaryKey) || table.fields[0];
      
      const stringFields = table.fields.filter(f => f.type === 'VARCHAR' || f.type === 'TEXT');
      let searchLogic = '';
      if (stringFields.length > 0) {
          const predicate = stringFields.map(f => `x.${toPascalCase(f.name)}.Contains(search)`).join(' || ');
          searchLogic = `if (!string.IsNullOrEmpty(search)) { q = q.Where(x => ${predicate}); }`;
      }

      // Security Check (Basic Table Level)
      // Only protect if User Login is active
      const authAttribute = useAuth ? `[Authorize]` : ``;
      
      const content = `using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using ${config.projectName}.Data;
using ${config.projectName}.Models;
using ${config.projectName}.Services;

namespace ${config.projectName}.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    ${authAttribute}
    public class ${safeName}Controller : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ICurrentUserService _currentUser;

        public ${safeName}Controller(AppDbContext context, ICurrentUserService currentUser) 
        { 
            _context = context; 
            _currentUser = currentUser;
        }

        [HttpGet]
        public async Task<ActionResult<PagedResult<${safeName}>>> Get([FromQuery] int page=1, [FromQuery] int pageSize=20, [FromQuery] string? search = null)
        {
            var q = _context.${safeName}s.AsQueryable();
            ${searchLogic}
            var total = await q.CountAsync();
            var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
            return new PagedResult<${safeName}> { Data = items, Total = total, Page = page, PageSize = pageSize, TotalPages = (int)Math.Ceiling(total/(double)pageSize) };
        }
        
        [HttpGet("{id}")]
        public async Task<ActionResult<${safeName}>> GetById(${resolveType(pkField, 'csharp')} id)
        {
            var item = await _context.${safeName}s.FindAsync(id);
            if (item == null) return NotFound();
            return item;
        }

        [HttpPost]
        public async Task<ActionResult> Post(${safeName} item) 
        { 
            _context.Add(item); 
            await _context.SaveChangesAsync(); 
            return Ok(item); 
        }
        
        [HttpPut("{id}")]
        public async Task<ActionResult> Put(${resolveType(pkField, 'csharp')} id, ${safeName} item) 
        { 
            if (id != item.${toPascalCase(pkField.name)}) return BadRequest();
            _context.Entry(item).State = EntityState.Modified; 
            await _context.SaveChangesAsync(); 
            return Ok(); 
        }
        
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(${resolveType(pkField, 'csharp')} id) { 
            var i = await _context.${safeName}s.FindAsync(id); 
            if(i!=null) { _context.Remove(i); await _context.SaveChangesAsync(); } 
            return Ok(); 
        }
    }
}`;
      files.push({ name: `${safeName}Controller.cs`, path: `${root}/Controllers/${safeName}Controller.cs`, content: content, language: 'csharp' });
  });

  return files;
};
