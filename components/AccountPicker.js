import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faPlus, faSignOut, faThumbsUp, faHeart, faFaceLaugh, faRotate } from '@fortawesome/free-solid-svg-icons';
import styles from '../styles/AccountPicker.module.css';

export default function AccountPicker() {
  const router = useRouter();
  const [savedAccounts, setSavedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [passwordPrompt, setPasswordPrompt] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    // Récupérer les comptes sauvegardés du localStorage
    loadSavedAccounts();
  }, []);

  const loadSavedAccounts = () => {
    try {
      // Récupérer le compte actuel s'il existe
      const currentUserStr = localStorage.getItem('user');
      let accounts = [];

      if (currentUserStr) {
        try {
          const currentUser = JSON.parse(currentUserStr);
          console.log('🔍 loadSavedAccounts - Compte actuel trouvé:', currentUser);
          accounts.push(currentUser);
        } catch (e) {
          console.error('Erreur lors du parsing du compte actuel:', e);
        }
      }

      // Vérifier s'il y a un historique de comptes dans le localStorage
      const accountsHistory = localStorage.getItem('savedAccounts');
      if (accountsHistory) {
        try {
          const history = JSON.parse(accountsHistory);
          // Fusionner avec le compte actuel (éviter les doublons)
          accounts = [...accounts, ...history.filter(acc =>
            !accounts.some(existing => existing.email === acc.email)
          )];
        } catch (e) {
          // Ignorer si l'historique est corrompu
        }
      }

      // Si aucun compte n'est trouvé, rediriger vers l'inscription
      if (accounts.length === 0) {
        console.log('⚠️ Aucun compte trouvé, redirection vers inscription');
        router.push('/auth?mode=register');
        return;
      }

      setSavedAccounts(accounts);
      setSelectedEmail(null); // Pas de pré-sélection
    } catch (e) {
      console.error('Error loading saved accounts:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelect = async (account) => {
    setSelectedEmail(account.email);
    setPasswordPrompt(account.email);
    setPassword('');
    setError('');
  };

  const handleQuickSignIn = async () => {
    if (!selectedEmail) return;

    const account = savedAccounts.find(a => a.email === selectedEmail);
    if (!account) return;

    setAuthLoading(true);
    setError('');

    try {
      // Mode démo : connexion immédiate
      console.log('🔧 Mode démo : connexion immédiate pour', account.email);
      localStorage.setItem('user', JSON.stringify(account));
      localStorage.setItem('token', account.token || 'demo-token-' + Date.now());

      // AJOUTER ce compte à l'historique (pas le supprimer)
      const currentSavedAccounts = savedAccounts.filter(a => a.email !== account.email);
      const updatedAccounts = [account, ...currentSavedAccounts];
      localStorage.setItem('savedAccounts', JSON.stringify(updatedAccounts));
      console.log('Compte sauvegardé dans savedAccounts:', updatedAccounts);

      window.dispatchEvent(new Event('userUpdated'));
      router.push('/');
    } catch (err) {
      setError('Erreur lors de la connexion');
    } finally {
      setAuthLoading(false);
      setPasswordPrompt(null);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Mot de passe requis');
      return;
    }

    setAuthLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: passwordPrompt,
          password: password
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur de connexion');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // AJOUTER ce compte à l'historique (pas le supprimer)
      const currentSavedAccounts = savedAccounts.filter(a => a.email !== passwordPrompt);
      const updatedAccounts = [data.user, ...currentSavedAccounts];
      localStorage.setItem('savedAccounts', JSON.stringify(updatedAccounts));
      console.log(' Compte sauvegardé dans savedAccounts:', updatedAccounts);

      window.dispatchEvent(new Event('userUpdated'));
      router.push('/');
    } catch (err) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAddAccount = () => {
    // Le compte actuel devrait déjà être chargé automatiquement dans loadSavedAccounts
    // Si ce n'est pas le cas, rediriger vers l'inscription
    console.log(' handleAddAccount appelé');
    router.push('/auth?mode=register');
  };

  const handleSignOut = (email) => {
    // Effacer ce compte de la liste sauvegardée
    const updated = savedAccounts.filter(a => a.email !== email);
    setSavedAccounts(updated);
    localStorage.setItem('savedAccounts', JSON.stringify(updated));

    if (selectedEmail === email) {
      if (updated.length > 0) {
        setSelectedEmail(updated[0].email);
      } else {
        // Plus de comptes, rediriger vers l'inscription pour en ajouter un nouveau
        router.push('/auth?mode=register');
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loader}>
          <div className={styles.spinner}></div>
          <p>Chargement des comptes...</p>
        </div>
      </div>
    );
  }

  if (savedAccounts.length === 0) {
    return null; // Redirection vers /auth déjà faite
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Section gauche - Image decorative */}
        <div className={styles.leftSection}>
          {/* Éléments flottants décoratifs */}
          <div className={styles.floatingElements}>
            <div className={styles.floatingCircle}></div>
            <div className={styles.floatingCircle}></div>
            <div className={styles.floatingCircle}></div>
            <div className={styles.floatingCircle}></div>
            <div className={styles.floatingCircle}></div>
            <div className={styles.floatingCircle}></div>
          </div>

          {/* Section du logo et texte - en haut */}
          <div className={styles.logoSection}>
            <div className={styles.unifyLogo}>
              <img src="/logo.svg" alt="Unify Logo" className={styles.logoImg} />
            </div>
            <h2 className={styles.welcomeText}>Bienvenue sur Unify</h2>
            <p className={styles.subtitleText}>Reconnectez-vous à votre communauté</p>
          </div>

          {/* Image picker - centrée seule */}
          <div className={styles.imageSection}>
            <div className={styles.imageContainer}>
              <div className={styles.imageWrapper}>
                <img src="/img-picker1.png" alt="Account Picker 1" className={styles.pickerImage} />
                <div className={styles.decorativeIcons}>
                  <div className={styles.iconTopRight}>
                    <FontAwesomeIcon icon={faHeart} className={styles.heartIcon} />
                  </div>
                </div>
              </div>
              <div className={styles.imageWrapper}>
                <img src="/img-picker.png" alt="Account Picker" className={styles.pickerImage} />
                <div className={styles.decorativeIcons}>
                  <div className={styles.iconTopRight}>
                    <FontAwesomeIcon icon={faThumbsUp} className={styles.likeIcon} />
                  </div>
                </div>
              </div>
              <div className={styles.imageWrapper}>
                <img src="/img-picker2.png" alt="Account Picker 2" className={styles.pickerImage} />
                <div className={styles.decorativeIcons}>
                  <div className={styles.iconTopRight}>
                    <FontAwesomeIcon icon={faFaceLaugh} className={styles.hahaIcon} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer avec texte animé */}
          <div className={styles.footerSection}>
            <div className={styles.footerText}>
              Rejoignez la communauté Unify, partagez vos moments idéal
            </div>
          </div>
        </div>

        {/* Section droite - Sélection des comptes */}
        <div className={styles.rightSection}>
          <div className={styles.header}>
            <h1>Reconnectez-vous</h1>
            <p>Sélectionnez votre compte pour retrouver votre communauté</p>
          </div>

          {passwordPrompt ? (
            // Formulaire de password
            <form onSubmit={handlePasswordSubmit} className={styles.passwordForm}>
              <div className={styles.passwordHeader}>
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={() => {
                    setPasswordPrompt(null);
                    setSelectedEmail(null);
                    setPassword('');
                    setError('');
                  }}
                >
                  ← Retour
                </button>
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <div className={styles.selectedAccountInfo}>
                {(() => {
                  const account = savedAccounts.find(a => a.email === passwordPrompt);
                  return (
                    <>
                      <img
                        src={account?.avatar || `/api/placeholder/80/80`}
                        alt={account?.prenom}
                        className={styles.accountAvatar}
                      />
                      <div>
                        <p className={styles.accountName}>
                          {account?.prenom} {account?.nom}
                        </p>
                        <p className={styles.accountEmail}>{account?.email}</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password">Mot de passe</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe"
                  required
                  disabled={authLoading}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className={styles.primaryBtn}
                disabled={authLoading}
              >
                {authLoading ? 'Connexion...' : (
                  <>
                    Se connecter
                    <FontAwesomeIcon icon={faArrowRight} />
                  </>
                )}
              </button>

              <a href="/auth" className={styles.forgotLink}>
                Mot de passe oublié?
              </a>
            </form>
          ) : (
            // Grille de sélection des comptes
            <div className={styles.accountsGrid}>
              {savedAccounts.map((account, index) => (
                <div
                  key={account.email}
                  className={`${styles.accountCard} ${
                    selectedEmail === account.email ? styles.selected : ''
                  }`}
                  onClick={() => handleAccountSelect(account)}
                  style={{ animationDelay: `${0.6 + index * 0.1}s` }}
                >
                  <div className={styles.accountCardHeader}>
                    <img
                      src={account.avatar || `/api/placeholder/60/60`}
                      alt={account.prenom}
                      className={styles.avatar}
                    />
                    <button
                      type="button"
                      className={styles.signOutBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSignOut(account.email);
                      }}
                      title="Déconnecter ce compte"
                    >
                      <FontAwesomeIcon icon={faSignOut} />
                    </button>
                    {/* Flèche ronde animée pour changement de compte */}
                    <span className={styles.switchArrowWrapper} title="Changer de compte">
                      <FontAwesomeIcon icon={faRotate} className={styles.switchArrow} />
                    </span>
                  </div>

                  <h3 className={styles.accountName}>
                    {account.prenom} {account.nom}
                  </h3>
                  <p className={styles.accountEmail}>{account.email}</p>
                  <p className={styles.accountHint}>Cliquez pour continuer avec ce compte</p>

                  {selectedEmail === account.email && (
                    <div className={styles.selectedBadge}>
                      <FontAwesomeIcon icon={faArrowRight} />
                      Compte sélectionné
                    </div>
                  )}
                </div>
              ))}

              {/* Carte pour ajouter un compte */}
              <div
                className={styles.accountCard}
                onClick={handleAddAccount}
              >
                <div className={styles.addAccountContent}>
                  <FontAwesomeIcon icon={faPlus} className={styles.addIcon} />
                  <h3>Ajouter un compte</h3>
                  <p>Connexion avec un autre compte</p>
                </div>
              </div>
            </div>
          )}

          {!passwordPrompt && selectedEmail && (
            <button
              className={styles.primaryBtn}
              onClick={handleQuickSignIn}
              disabled={authLoading}
            >
              {authLoading ? 'Connexion...' : (
                <>
                  Se connecter
                  <FontAwesomeIcon icon={faArrowRight} />
                </>
              )}
            </button>
          )}

          {!passwordPrompt && (
            <div className={styles.footer}>
              <p>Vous n'avez pas de compte?</p>
              <a href="/auth?mode=register">Créer un compte</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
