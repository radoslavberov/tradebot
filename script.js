const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const mobileLinks = document.querySelectorAll('.mobile-nav a');

menuToggle?.addEventListener('click', () => {
  const isOpen = header.classList.toggle('open');
  document.body.classList.toggle('menu-open', isOpen);
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

mobileLinks.forEach((link) => {
  link.addEventListener('click', () => {
    header.classList.remove('open');
    document.body.classList.remove('menu-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});

const billingButtons = document.querySelectorAll('[data-billing]');
const priceValues = document.querySelectorAll('.price strong[data-monthly]');

billingButtons.forEach((button) => {
  button.addEventListener('click', () => {
    billingButtons.forEach((item) => item.classList.remove('active'));
    button.classList.add('active');

    const period = button.dataset.billing;
    priceValues.forEach((value) => {
      value.textContent = value.dataset[period];
    });
  });
});

const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach((item) => {
  const button = item.querySelector('button');
  const symbol = item.querySelector('.faq-plus');

  button.addEventListener('click', () => {
    const wasOpen = item.classList.contains('open');

    faqItems.forEach((otherItem) => {
      otherItem.classList.remove('open');
      otherItem.querySelector('button').setAttribute('aria-expanded', 'false');
      otherItem.querySelector('.faq-plus').textContent = '+';
    });

    if (!wasOpen) {
      item.classList.add('open');
      button.setAttribute('aria-expanded', 'true');
      symbol.textContent = '−';
    }
  });
});

const miniFeatures = document.querySelectorAll('.mini-feature');
miniFeatures.forEach((feature) => {
  feature.addEventListener('click', () => {
    miniFeatures.forEach((item) => item.classList.remove('active'));
    feature.classList.add('active');
  });
});


// Registration wizard -------------------------------------------------------
const registrationModal = document.getElementById('registrationModal');
const registrationForm = document.getElementById('registrationForm');
const registrationSteps = [...document.querySelectorAll('[data-register-step]')];
const registrationNext = document.getElementById('registrationNext');
const registrationBack = document.getElementById('registrationBack');
const registrationProgressBar = document.getElementById('registrationProgressBar');
const registrationStepLabel = document.getElementById('registrationStepLabel');
const registrationTitle = document.getElementById('registrationTitle');
const registrationSubtitle = document.getElementById('registrationSubtitle');
const registrationSuccess = document.getElementById('registrationSuccess');
const registrationEmail = document.getElementById('registrationEmail');
const walletProviderButtons = [...document.querySelectorAll('[data-wallet-option]')];
const walletStatus = document.getElementById('walletStatus');
const walletAddress = document.getElementById('walletAddress');
const walletProviderLabel = document.getElementById('walletProviderLabel');
const walletNetwork = document.getElementById('walletNetwork');

let registrationStep = 1;
let connectedWalletAddress = '';
let connectedWalletType = '';
let connectedWalletNetwork = '';
const discoveredEvmProviders = new Map();

const registrationCopy = {
  1: ['Create your Tradebot account', 'Start with the basics. You can connect your wallet at the end.'],
  2: ['Personalize your setup', 'Tell us how you plan to use Tradebot so the dashboard can be tailored later.'],
  3: ['Confirm the essentials', 'Review the basic requirements before connecting your wallet.'],
  4: ['Connect your wallet', 'Associate a public wallet address with your Tradebot profile.']
};


// Discover EVM wallets using EIP-6963 so multiple extensions can coexist.
window.addEventListener('eip6963:announceProvider', (event) => {
  const detail = event.detail;
  if (!detail?.provider || !detail?.info) return;
  const key = detail.info.uuid || detail.info.rdns || detail.info.name;
  discoveredEvmProviders.set(key, detail);
  refreshWalletProviderUI();
});
window.dispatchEvent(new Event('eip6963:requestProvider'));

function getPhantomSolanaProvider() {
  const provider = window.phantom?.solana;
  return provider?.isPhantom ? provider : null;
}

function getMetaMaskProvider() {
  for (const detail of discoveredEvmProviders.values()) {
    const name = String(detail.info?.name || '').toLowerCase();
    const rdns = String(detail.info?.rdns || '').toLowerCase();
    if (name.includes('metamask') || rdns.includes('metamask')) return detail.provider;
  }

  // Fallback for older injected-provider implementations.
  if (window.ethereum?.providers?.length) {
    return window.ethereum.providers.find((provider) => provider.isMetaMask && !provider.isPhantom) || null;
  }
  if (window.ethereum?.isMetaMask && !window.ethereum?.isPhantom) return window.ethereum;
  return null;
}

function setWalletProviderState(type, available) {
  const button = document.querySelector(`[data-wallet-option="${type}"]`);
  const state = document.querySelector(`[data-wallet-state="${type}"]`);
  if (!button || !state) return;
  button.classList.toggle('is-unavailable', !available);
  button.setAttribute('aria-disabled', String(!available));
  state.textContent = available ? 'Detected' : 'Not detected';
}

function refreshWalletProviderUI() {
  setWalletProviderState('phantom-solana', Boolean(getPhantomSolanaProvider()));
  setWalletProviderState('metamask-evm', Boolean(getMetaMaskProvider()));
}

function showConnectedWallet({ address, provider, network }) {
  connectedWalletAddress = address;
  connectedWalletType = provider;
  connectedWalletNetwork = network;
  walletAddress.textContent = address;
  walletProviderLabel.textContent = `${provider} connected`;
  walletNetwork.textContent = network;
  walletStatus.hidden = false;
  walletProviderButtons.forEach((button) => {
    button.classList.toggle('is-connected', button.dataset.walletOption === (provider === 'Phantom' ? 'phantom-solana' : 'metamask-evm'));
  });
}

function setRegistrationError(key, message = '') {
  const target = document.querySelector(`[data-error-for="${key}"]`);
  if (target) target.textContent = message;
}

function renderRegistrationStep() {
  registrationSteps.forEach((step) => {
    step.classList.toggle('is-active', Number(step.dataset.registerStep) === registrationStep);
  });

  registrationStepLabel.textContent = `Step ${registrationStep} of 4`;
  registrationTitle.textContent = registrationCopy[registrationStep][0];
  registrationSubtitle.textContent = registrationCopy[registrationStep][1];
  registrationProgressBar.style.width = `${registrationStep * 25}%`;
  registrationBack.hidden = registrationStep === 1;
  if (registrationStep === 4) refreshWalletProviderUI();
  registrationNext.innerHTML = registrationStep === 4
    ? 'Finish registration <span>→</span>'
    : 'Continue <span>→</span>';
}

function openRegistration() {
  registrationModal?.classList.add('is-open');
  registrationModal?.setAttribute('aria-hidden', 'false');
  document.body.classList.add('registration-open');
  header?.classList.remove('open');
  document.body.classList.remove('menu-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  window.setTimeout(() => registrationDialogFocus(), 50);
}

function registrationDialogFocus() {
  const firstInput = registrationModal?.querySelector('.registration-step.is-active input');
  firstInput?.focus();
}

function closeRegistration() {
  registrationModal?.classList.remove('is-open');
  registrationModal?.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('registration-open');
}

function validateRegistrationStep() {
  if (!registrationForm) return false;

  if (registrationStep === 1) {
    setRegistrationError('account');
    const firstName = registrationForm.elements.firstName;
    const lastName = registrationForm.elements.lastName;
    const email = registrationForm.elements.email;
    const password = registrationForm.elements.password;
    const confirmPassword = registrationForm.elements.confirmPassword;

    if (!firstName.value.trim() || !lastName.value.trim() || !email.value.trim() || !password.value || !confirmPassword.value) {
      setRegistrationError('account', 'Please complete all account fields.');
      return false;
    }
    if (!email.checkValidity()) {
      setRegistrationError('account', 'Enter a valid email address.');
      return false;
    }
    if (password.value.length < 8) {
      setRegistrationError('account', 'Your password must contain at least 8 characters.');
      return false;
    }
    if (password.value !== confirmPassword.value) {
      setRegistrationError('account', 'The passwords do not match.');
      return false;
    }
    return true;
  }

  if (registrationStep === 2) {
    setRegistrationError('preferences');
    const experience = registrationForm.querySelector('input[name="experience"]:checked');
    const goal = registrationForm.querySelector('input[name="goal"]:checked');
    if (!experience || !goal) {
      setRegistrationError('preferences', 'Choose your experience level and primary goal.');
      return false;
    }
    return true;
  }

  if (registrationStep === 3) {
    setRegistrationError('confirmations');
    const age = registrationForm.elements.ageConfirmed.checked;
    const risk = registrationForm.elements.riskConfirmed.checked;
    const terms = registrationForm.elements.termsConfirmed.checked;
    if (!age || !risk || !terms) {
      setRegistrationError('confirmations', 'All confirmations are required to continue.');
      return false;
    }
    return true;
  }

  if (registrationStep === 4) {
    setRegistrationError('wallet');
    if (!connectedWalletAddress) {
      setRegistrationError('wallet', 'Connect a wallet before finishing registration.');
      return false;
    }
    return true;
  }

  return true;
}

function finishRegistration() {
  const formData = new FormData(registrationForm);
  const registrationData = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    experience: formData.get('experience'),
    goal: formData.get('goal'),
    walletAddress: connectedWalletAddress,
    walletProvider: connectedWalletType,
    walletNetwork: connectedWalletNetwork
  };

  registrationEmail.textContent = registrationData.email;
  registrationForm.hidden = true;
  document.querySelector('.registration-heading').hidden = true;
  document.querySelector('.registration-progress').hidden = true;
  registrationSuccess.hidden = false;
}

registrationNext?.addEventListener('click', () => {
  if (!validateRegistrationStep()) return;
  if (registrationStep < 4) {
    registrationStep += 1;
    renderRegistrationStep();
    registrationDialogFocus();
  } else {
    finishRegistration();
  }
});

registrationBack?.addEventListener('click', () => {
  if (registrationStep > 1) {
    registrationStep -= 1;
    renderRegistrationStep();
  }
});

walletProviderButtons.forEach((button) => {
  button.addEventListener('click', async () => {
    const type = button.dataset.walletOption;
    setRegistrationError('wallet');

    if (button.classList.contains('is-unavailable')) {
      const walletName = type === 'phantom-solana' ? 'Phantom' : 'MetaMask';
      setRegistrationError('wallet', `${walletName} was not detected. Install or enable the extension, then refresh this page.`);
      return;
    }

    walletProviderButtons.forEach((item) => { item.disabled = true; });
    button.classList.add('is-connecting');

    try {
      if (type === 'phantom-solana') {
        const provider = getPhantomSolanaProvider();
        if (!provider) throw new Error('Phantom provider unavailable.');
        const response = await provider.connect();
        const publicKey = response?.publicKey || provider.publicKey;
        const address = publicKey?.toString?.();
        if (!address) throw new Error('No Solana address returned.');
        showConnectedWallet({ address, provider: 'Phantom', network: 'Solana' });
      }

      if (type === 'metamask-evm') {
        const provider = getMetaMaskProvider();
        if (!provider?.request) throw new Error('MetaMask provider unavailable.');
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        const address = accounts?.[0];
        if (!address) throw new Error('No EVM address returned.');
        let network = 'Ethereum / EVM';
        try {
          const chainId = await provider.request({ method: 'eth_chainId' });
          if (chainId) network = `EVM · chain ${parseInt(chainId, 16)}`;
        } catch (_) {}
        showConnectedWallet({ address, provider: 'MetaMask', network });
      }
    } catch (error) {
      const rejected = error?.code === 4001 || error?.code === 4001 || /reject|cancel/i.test(error?.message || '');
      setRegistrationError('wallet', rejected
        ? 'Wallet connection was cancelled.'
        : 'Unable to connect the wallet. Unlock the extension and try again.');
    } finally {
      button.classList.remove('is-connecting');
      walletProviderButtons.forEach((item) => { item.disabled = false; });
      refreshWalletProviderUI();
    }
  });
});

const tradeNowButtons = [...document.querySelectorAll('a.button')].filter((link) =>
  link.textContent.trim().toLowerCase().startsWith('trade now')
);

tradeNowButtons.forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();
    openRegistration();
  });
});

document.querySelectorAll('[data-register-close]').forEach((button) => {
  button.addEventListener('click', closeRegistration);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && registrationModal?.classList.contains('is-open')) {
    closeRegistration();
  }
});

renderRegistrationStep();
