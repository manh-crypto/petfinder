// Firebase adapter: nạp SDK (Auth + Firestore) và đăng nhập Google / Facebook (qua Firebase Authentication).
(function createSocialAuthService(global) {
  const FIREBASE_VERSION = '10.14.1';
  let firebaseReadyPromise = null;

  function loadScript(src) {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      return new Promise((resolve, reject) => {
        if (existing.dataset.loaded === 'true') return resolve();
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
      });
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.addEventListener('load', () => {
        script.dataset.loaded = 'true';
        resolve();
      }, { once: true });
      script.addEventListener('error', () => reject(new Error('Không tải được Firebase SDK.')), { once: true });
      document.head.appendChild(script);
    });
  }

  function getFirebaseConfig() {
    const config = global.PETFINDER_CONFIG && global.PETFINDER_CONFIG.firebase;
    const required = ['apiKey', 'authDomain', 'projectId', 'appId'];
    if (!config || required.some(key => !config[key])) {
      throw new Error('Chưa cấu hình Firebase. Hãy điền thông tin dự án trong js/config.js.');
    }
    return config;
  }

  async function initialize() {
    if (firebaseReadyPromise) return firebaseReadyPromise;

    firebaseReadyPromise = (async () => {
      const config = getFirebaseConfig();
      await loadScript(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app-compat.js`);
      await loadScript(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth-compat.js`);
      await loadScript(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore-compat.js`);

      const app = global.firebase.apps.length
        ? global.firebase.app()
        : global.firebase.initializeApp(config);
      const auth = app.auth();
      await auth.setPersistence(global.firebase.auth.Auth.Persistence.LOCAL);
      return auth;
    })().catch(error => {
      firebaseReadyPromise = null;
      throw error;
    });

    return firebaseReadyPromise;
  }

  function createProvider(providerName) {
    if (providerName === 'facebook') {
      const fb = new global.firebase.auth.FacebookAuthProvider();
      fb.addScope('email');
      return fb;
    }
    if (providerName !== 'google') {
      throw new Error('Nhà cung cấp đăng nhập không được hỗ trợ.');
    }

    const provider = new global.firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    return provider;
  }

  function toPetFinderUser(firebaseUser, providerName) {
    return {
      uid: firebaseUser.uid,
      provider: providerName,
      name: firebaseUser.displayName || firebaseUser.email || 'Người dùng PetFinder',
      email: firebaseUser.email || '',
      phone: firebaseUser.phoneNumber || '',
      avatar: 'G',
      avatarPhoto: firebaseUser.photoURL || '',
      role: 'user'
    };
  }

  async function signIn(providerName) {
    const auth = await initialize();
    const result = await auth.signInWithPopup(createProvider(providerName));
    return toPetFinderUser(result.user, providerName);
  }

  async function signOut() {
    if (!global.firebase || !global.firebase.apps.length) return;
    await global.firebase.auth().signOut();
  }

  global.PetFinderSocialAuth = { initialize, signIn, signOut };
})(window);
