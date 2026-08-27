import { VirtualFile } from '../../../../types/index';

export const generateAuthServices = (namespace: string, root: string): VirtualFile[] => {
  const files: VirtualFile[] = [];

  const authService = `using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.JSInterop;
using ${namespace}.Models;

namespace ${namespace}.Services
{
    public class AuthService
    {
        private readonly HttpClient _http;
        private readonly AuthenticationStateProvider _provider;
        private readonly IJSRuntime _js;

        public AuthService(HttpClient http, AuthenticationStateProvider provider, IJSRuntime js)
        {
            _http = http;
            _provider = provider;
            _js = js;
        }

        public async Task<bool> Login(LoginModel model)
        {
            var res = await _http.PostAsJsonAsync("auth/login", model);
            if (!res.IsSuccessStatusCode)
            {
                return false;
            }

            var data = await res.Content.ReadFromJsonAsync<AuthResponse>();
            if (data != null && !string.IsNullOrEmpty(data.Token))
            {
                await _js.InvokeVoidAsync("localStorage.setItem", "auth_token", data.Token);
                ((CustomAuthStateProvider)_provider).NotifyUserAuthentication(data.Token);
                return true;
            }
            return false;
        }

        public async Task<bool> Register(RegisterModel model)
        {
            var res = await _http.PostAsJsonAsync("auth/register", model);
            return res.IsSuccessStatusCode;
        }

        public async Task<bool> ChangePassword(ChangePasswordModel model)
        {
            var res = await _http.PostAsJsonAsync("auth/change-password", model);
            return res.IsSuccessStatusCode;
        }

        public async Task Logout()
        {
            await _js.InvokeVoidAsync("localStorage.removeItem", "auth_token");
            ((CustomAuthStateProvider)_provider).NotifyUserLogout();
        }
    }
}
`;
  files.push({
    name: 'AuthService.cs',
    path: `${root}/Services/AuthService.cs`,
    content: authService,
    language: 'csharp'
  });

  const authProvider = `using System;
using System.Security.Claims;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.JSInterop;
using System.Text.Json;

namespace ${namespace}.Services
{
    public class CustomAuthStateProvider : AuthenticationStateProvider
    {
        private readonly IJSRuntime _js;

        public CustomAuthStateProvider(IJSRuntime js)
        {
            _js = js;
        }

        public override async Task<AuthenticationState> GetAuthenticationStateAsync()
        {
            var token = await _js.InvokeAsync<string>("localStorage.getItem", "auth_token");
            if (string.IsNullOrEmpty(token))
            {
                return new AuthenticationState(new ClaimsPrincipal(new ClaimsIdentity()));
            }

            try
            {
                var claims = ParseClaimsFromJwt(token);
                var identity = new ClaimsIdentity(claims, "jwt");
                return new AuthenticationState(new ClaimsPrincipal(identity));
            }
            catch
            {
                return new AuthenticationState(new ClaimsPrincipal(new ClaimsIdentity()));
            }
        }

        public void NotifyUserAuthentication(string token)
        {
            var identity = new ClaimsIdentity(ParseClaimsFromJwt(token), "jwt");
            var user = new ClaimsPrincipal(identity);
            NotifyAuthenticationStateChanged(Task.FromResult(new AuthenticationState(user)));
        }

        public void NotifyUserLogout()
        {
            var identity = new ClaimsIdentity();
            var user = new ClaimsPrincipal(identity);
            NotifyAuthenticationStateChanged(Task.FromResult(new AuthenticationState(user)));
        }

        private IEnumerable<Claim> ParseClaimsFromJwt(string jwt)
        {
            var claims = new List<Claim>();
            var parts = jwt.Split('.');
            if (parts.Length < 2) return claims;

            var payload = parts[1];
            var jsonBytes = ParseBase64WithoutPadding(payload);
            var keyValuePairs = JsonSerializer.Deserialize<Dictionary<string, object>>(jsonBytes);

            if (keyValuePairs != null)
            {
                foreach (var kvp in keyValuePairs)
                {
                    if (kvp.Key == "role" || kvp.Key == "http://schemas.microsoft.com/ws/2008/06/identity/claims/role")
                    {
                        if (kvp.Value is JsonElement element && element.ValueKind == JsonValueKind.Array)
                        {
                            foreach (var role in element.EnumerateArray())
                            {
                                claims.Add(new Claim(ClaimTypes.Role, role.ToString()));
                            }
                        }
                        else
                        {
                            claims.Add(new Claim(ClaimTypes.Role, kvp.Value.ToString()!));
                        }
                    }
                    else
                    {
                        claims.Add(new Claim(kvp.Key, kvp.Value?.ToString() ?? ""));
                    }
                }
            }
            return claims;
        }

        private byte[] ParseBase64WithoutPadding(string base64)
        {
            switch (base64.Length % 4)
            {
                case 2: base64 += "=="; break;
                case 3: base64 += "="; break;
            }
            return Convert.FromBase64String(base64);
        }
    }
}
`;
  files.push({
    name: 'CustomAuthStateProvider.cs',
    path: `${root}/Services/CustomAuthStateProvider.cs`,
    content: authProvider,
    language: 'csharp'
  });

  return files;
};
