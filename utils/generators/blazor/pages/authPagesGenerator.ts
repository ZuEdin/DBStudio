import { VirtualFile } from '../../../../types/index';

export const generateAuthPages = (
  namespace: string,
  root: string
): VirtualFile[] => {
  const files: VirtualFile[] = [];

  // Login.razor
  const loginPage = `@page "/login"
@inject AuthService Auth
@inject NavigationManager Nav
@using ${namespace}.Models

<div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-md-5 col-lg-4">
            <div class="card shadow-sm border-0 rounded-3">
                <div class="card-body p-4">
                    <div class="text-center mb-4">
                        <div class="bg-primary-subtle d-inline-block p-3 rounded-circle text-primary mb-2">
                            <i class="bi bi-person-lock fs-2"></i>
                        </div>
                        <h4 class="fw-bold text-slate-800">Anmeldung</h4>
                        <p class="text-secondary small">Melden Sie sich an, um fortzufahren.</p>
                    </div>

                    @if (!string.IsNullOrEmpty(errorMessage))
                    {
                        <div class="alert alert-danger py-2 small" role="alert">
                            @errorMessage
                        </div>
                    }

                    <EditForm Model="model" OnValidSubmit="DoLogin">
                        <DataAnnotationsValidator />
                        <div class="mb-3">
                            <label class="form-label text-secondary small fw-bold">Benutzername</label>
                            <InputText @bind-Value="model.Username" class="form-control" placeholder="Benutzername" />
                            <ValidationMessage For="@(() => model.Username)" class="text-danger small" />
                        </div>
                        <div class="mb-3">
                            <label class="form-label text-secondary small fw-bold">Passwort</label>
                            <InputText @bind-Value="model.Password" type="password" class="form-control" placeholder="••••••••" />
                            <ValidationMessage For="@(() => model.Password)" class="text-danger small" />
                        </div>
                        <button class="btn btn-primary w-100 fw-semibold py-2 mt-2" type="submit" disabled="@isLoading">
                            @if (isLoading)
                            {
                                <span class="spinner-border spinner-border-sm me-2"></span>
                                <span>Anmelden...</span>
                            }
                            else
                            {
                                <span>Anmelden</span>
                            }
                        </button>
                    </EditForm>

                    <div class="mt-3 text-center">
                        <a href="forgot-password" class="small text-decoration-none">Passwort vergessen?</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

@code {
    private LoginModel model = new();
    private bool isLoading = false;
    private string errorMessage = "";

    private async Task DoLogin()
    {
        isLoading = true;
        errorMessage = "";
        try
        {
            var success = await Auth.Login(model);
            if (success)
            {
                Nav.NavigateTo("/");
            }
            else
            {
                errorMessage = "Ungültige Anmeldedaten.";
            }
        }
        catch (Exception ex)
        {
            errorMessage = $"Fehler beim Login: {ex.Message}";
        }
        finally
        {
            isLoading = false;
        }
    }
}
`;
  files.push({ name: 'Login.razor', path: `${root}/Pages/Login.razor`, content: loginPage, language: 'razor' });

  // Register.razor
  const registerPage = `@page "/register"
@inject AuthService Auth
@inject NavigationManager Nav
@using ${namespace}.Models

<div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-md-5 col-lg-4">
            <div class="card shadow-sm border-0 rounded-3">
                <div class="card-body p-4">
                    <div class="text-center mb-4">
                        <h4 class="fw-bold text-slate-800">Konto registrieren</h4>
                        <p class="text-secondary small">Erstellen Sie ein neues Benutzerkonto.</p>
                    </div>

                    <EditForm Model="model" OnValidSubmit="DoRegister">
                        <DataAnnotationsValidator />
                        <div class="mb-3">
                            <label class="form-label text-secondary small fw-bold">Benutzername</label>
                            <InputText @bind-Value="model.Username" class="form-control" />
                            <ValidationMessage For="@(() => model.Username)" class="text-danger small" />
                        </div>
                        <div class="mb-3">
                            <label class="form-label text-secondary small fw-bold">E-Mail</label>
                            <InputText @bind-Value="model.Email" class="form-control" />
                            <ValidationMessage For="@(() => model.Email)" class="text-danger small" />
                        </div>
                        <div class="mb-3">
                            <label class="form-label text-secondary small fw-bold">Passwort</label>
                            <InputText @bind-Value="model.Password" type="password" class="form-control" />
                            <ValidationMessage For="@(() => model.Password)" class="text-danger small" />
                        </div>
                        <button class="btn btn-success w-100 fw-semibold py-2 mt-2" type="submit">Registrieren</button>
                    </EditForm>
                    <div class="mt-3 text-center">
                        <a href="login" class="small text-decoration-none">Bereits registriert? Zum Login</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

@code {
    private RegisterModel model = new();

    private async Task DoRegister()
    {
        var success = await Auth.Register(model);
        if (success)
        {
            Nav.NavigateTo("/login");
        }
    }
}
`;
  files.push({ name: 'Register.razor', path: `${root}/Pages/Register.razor`, content: registerPage, language: 'razor' });

  // ForgotPassword.razor
  const forgotPwPage = `@page "/forgot-password"
<div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-md-5 col-lg-4">
            <div class="card shadow-sm border-0 rounded-3">
                <div class="card-body p-4 text-center">
                    <h4 class="fw-bold text-slate-800 mb-2">Passwort zurücksetzen</h4>
                    <p class="text-secondary small mb-4">Geben Sie Ihre E-Mail-Adresse ein, um einen Link zum Zurücksetzen zu erhalten.</p>
                    <input type="email" class="form-control mb-3" placeholder="name@beispiel.de" />
                    <button class="btn btn-primary w-100 fw-semibold mb-3" @onclick="SendReset">Link senden</button>
                    <a href="login" class="small text-decoration-none d-block">Zurück zur Anmeldung</a>
                </div>
            </div>
        </div>
    </div>
</div>

@code {
    private void SendReset()
    {
        // Simulation reset
    }
}
`;
  files.push({ name: 'ForgotPassword.razor', path: `${root}/Pages/ForgotPassword.razor`, content: forgotPwPage, language: 'razor' });

  // Profile.razor
  const profilePage = `@page "/profile"
@attribute [Authorize]
@inject AuthService Auth
@using ${namespace}.Models

<div class="container py-3">
    <div class="row justify-content-center">
        <div class="col-md-6">
            <div class="card shadow-sm border-0 rounded-3">
                <div class="card-body p-4">
                    <h4 class="fw-bold text-slate-800 mb-3"><i class="bi bi-person-circle me-2 text-primary"></i>Mein Profil</h4>
                    <hr />
                    <h5 class="fw-bold text-secondary mb-3">Passwort ändern</h5>
                    
                    @if (isSuccess)
                    {
                        <div class="alert alert-success py-2 small">Passwort erfolgreich geändert!</div>
                    }

                    <EditForm Model="model" OnValidSubmit="ChangePw">
                        <DataAnnotationsValidator />
                        <div class="mb-3">
                            <label class="form-label text-secondary small fw-bold">Aktuelles Passwort</label>
                            <InputText @bind-Value="model.OldPassword" type="password" class="form-control" />
                        </div>
                        <div class="mb-3">
                            <label class="form-label text-secondary small fw-bold">Neues Passwort</label>
                            <InputText @bind-Value="model.NewPassword" type="password" class="form-control" />
                        </div>
                        <button class="btn btn-primary fw-semibold" type="submit">Passwort speichern</button>
                    </EditForm>
                </div>
            </div>
        </div>
    </div>
</div>

@code {
    private ChangePasswordModel model = new();
    private bool isSuccess = false;

    private async Task ChangePw()
    {
        isSuccess = await Auth.ChangePassword(model);
    }
}
`;
  files.push({ name: 'Profile.razor', path: `${root}/Pages/Profile.razor`, content: profilePage, language: 'razor' });

  return files;
};
