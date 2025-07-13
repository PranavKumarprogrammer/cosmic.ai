// Initialize Firebase app and auth using global firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();

//! Providers
const googleProvider = new firebase.auth.GoogleAuthProvider();
const microsoftProvider = new firebase.auth.OAuthProvider('microsoft.com');
const githubProvider = new firebase.auth.GithubAuthProvider();

//! Function to handle social media login with account linking
async function handleSocialMediaLogin(provider) {
    try {
        const result = await auth.signInWithPopup(provider);
        console.log('User logged in:', result.user);
        alert('Login successful!');
        window.location.href = "main.html";
    } catch (error) {
        // Microsoft OAuth errors
        if (provider.providerId === 'microsoft.com') {
            // Log the full error object for debugging
            console.error('Full Microsoft OAuth error:', error);
            let errorMsg = "Microsoft login failed.";
            if (error.message) errorMsg += "\n" + error.message;
            if (error.code) errorMsg += "\nError code: " + error.code;
            if (error.customData && error.customData.error) errorMsg += "\nDetails: " + error.customData.error;
            alert(errorMsg + "\nPlease check your Azure app registration, client secret, and redirect URI in both Azure and Firebase.");
            return;
        }
        if (error.code === 'auth/account-exists-with-different-credential') {
            const email = error.email || (error.customData && error.customData.email);
            const pendingCredential = error.credential;
            try {
                const methods = await auth.fetchSignInMethodsForEmail(email);
                // If the provider is available, sign in with it
                if (methods.includes(provider.providerId)) {
                    let providerToUse;
                    if (provider.providerId === 'github.com') providerToUse = githubProvider;
                    else if (provider.providerId === 'microsoft.com') providerToUse = microsoftProvider;
                    else if (provider.providerId === 'google.com') providerToUse = googleProvider;
                    else providerToUse = googleProvider; // fallback
                    const linkedResult = await auth.signInWithPopup(providerToUse);
                    alert('Login successful!');
                    window.location.href = "main.html";
                } else {
                    alert(`Please log in using: ${methods.join(', ')} for this email.`);
                }
            } catch (linkError) {
                console.error('Account linking error:', linkError);
                alert(`Login failed: ${linkError.message}`);
            }
        } else {
            console.error('Social media login error:', error);
            alert(`Login failed: ${error.message}`);
        }
    }
}

// Attach social media login functions to window
window.signInWithGoogle = () => handleSocialMediaLogin(googleProvider);
window.signInWithMicrosoft = () => handleSocialMediaLogin(microsoftProvider);
window.signInWithGithub = () => handleSocialMediaLogin(githubProvider);

//!! Login-Register Switcher and Form Handlers
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.container');
    const registerBtn = document.querySelector('.register-btn');
    const loginBtn = document.querySelector('.login-btn');
    const loginForm = document.querySelector('.form-box.login');
    const registerForm = document.querySelector('.form-box.register');

    if (registerBtn && container && loginForm && registerForm) {
        registerBtn.addEventListener('click', () => {
            container.classList.add('active');
            loginForm.style.visibility = 'hidden';
            registerForm.style.visibility = 'visible';
        });

        loginBtn.addEventListener('click', () => {
            container.classList.remove('active');
            loginForm.style.visibility = 'visible';
            registerForm.style.visibility = 'hidden';
        });
    }

    // Email Registration/Login
    const registerFormElement = document.querySelector('.form-box.register form');
    const loginFormElement = document.querySelector('.form-box.login form');

    // Email registration
    if (registerFormElement) {
        registerFormElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = registerFormElement.querySelector('input[type="email"]').value;
            const password = registerFormElement.querySelector('input[type="password"]').value;

            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                console.log('User registered:', userCredential.user);
                alert('Registration successful! Logging you in...');
                localStorage.setItem("cosmicai_login_time", Date.now().toString());
                window.location.href = "main.html";
            } catch (error) {
                console.error('Registration error:', error);
                alert(error.message);
            }
        });
    }

    // Email login
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginFormElement.querySelector('input[type="text"]').value;
            const password = loginFormElement.querySelector('input[type="password"]').value;

            try {
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                console.log('User logged in:', userCredential.user);
                alert('Login successful!');
                localStorage.setItem("cosmicai_login_time", Date.now().toString());
                window.location.href = "main.html";
            } catch (error) {
                console.error('Login error:', error);
                alert(error.message);
            }
        });
    }
});



