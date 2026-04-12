import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, faMousePointer, faChartPie, faCheckCircle, 
  faArrowTrendUp, faWallet, faEdit, faCheck, faTimes, 
  faArrowLeft, faUsers, faVenusMars, faGlobe, faCity, 
  faLightbulb, faMobileAlt, faDesktop, faTabletAlt, 
  faToggleOn, faToggleOff, faExclamationTriangle, faCog 
} from '@fortawesome/free-solid-svg-icons';
import styles from '../styles/sponsor-analytics.module.css';

export default function SponsorAnalyticsDashboard({ sponsorId, onBack }) {
  const [stats, setStats] = useState(null);
  const [targeting, setTargeting] = useState(null);
  const [quotas, setQuotas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingTarget, setEditingTarget] = useState(false);
  const [editingQuota, setEditingQuota] = useState(false);
  const [activeTab, setActiveTab] = useState('stats');

  const [targetForm, setTargetForm] = useState({
    minAge: '',
    maxAge: '',
    gender: '',
    countries: [],
    cities: [],
    interests: [],
    devices: []
  });

  const [quotaForm, setQuotaForm] = useState({
    dailyBudgetLimit: '',
    monthlyBudgetLimit: '',
    totalBudgetLimit: '',
    dailyImpressionLimit: '',
    monthlyImpressionLimit: '',
    active: true
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, targetRes, quotaRes] = await Promise.all([
        fetch(`/api/sponsors/${sponsorId}/stats`),
        fetch(`/api/sponsors/${sponsorId}/targeting`),
        fetch(`/api/sponsors/${sponsorId}/quotas`)
      ]);
      const statsData = await statsRes.json();
      const targetData = await targetRes.json();
      const quotaData = await quotaRes.json();
      setStats(statsData);
      setTargeting(targetData);
      setQuotas(quotaData);
      setTargetForm(targetData);
      setQuotaForm(quotaData);
    } catch (e) {
      console.error('error fetching analytics', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [sponsorId]);

  const saveTargeting = async () => {
    try {
      await fetch(`/api/sponsors/${sponsorId}/targeting`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetForm)
      });
      setEditingTarget(false);
      fetchData();
    } catch (e) {
      console.error('error saving targeting', e);
    }
  };

  const saveQuota = async () => {
    try {
      await fetch(`/api/sponsors/${sponsorId}/quotas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quotaForm)
      });
      setEditingQuota(false);
      fetchData();
    } catch (e) {
      console.error('error saving quota', e);
    }
  };

  if (loading) return (
    <div className={styles.loading}>
      <div className={styles.spinner}></div>
      <p>Chargement des données...</p>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1 className={styles.mainTitle}>
              <FontAwesomeIcon icon={faChartLine} /> Tableau de Bord - Sponsor #{sponsorId}
            </h1>
            <p className={styles.subtitle}>Gestion des campagnes publicitaires</p>
          </div>
          {onBack && (
            <button className={styles.backBtn} onClick={onBack}>
              <FontAwesomeIcon icon={faArrowLeft} /> Retour
            </button>
          )}
        </div>
      </div>

      {/* TABS */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'stats' ? styles.active : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <FontAwesomeIcon icon={faChartPie} /> Statistiques
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'targeting' ? styles.active : ''}`}
            onClick={() => setActiveTab('targeting')}
          >
            <FontAwesomeIcon icon={faUsers} /> Ciblage
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'quotas' ? styles.active : ''}`}
            onClick={() => setActiveTab('quotas')}
          >
            <FontAwesomeIcon icon={faWallet} /> Quotas
          </button>
        </div>
      </div>

      {/* STATS TAB */}
      {activeTab === 'stats' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Statistiques de Performance</h2>
          </div>
          {stats && (
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIconWrapper} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <FontAwesomeIcon icon={faMousePointer} />
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{stats.impressions.toLocaleString()}</div>
                  <div className={styles.statLabel}>Impressions</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIconWrapper} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                  <FontAwesomeIcon icon={faMousePointer} />
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{stats.clicks.toLocaleString()}</div>
                  <div className={styles.statLabel}>Clics</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIconWrapper} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                  <FontAwesomeIcon icon={faChartPie} />
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{typeof stats.ctr === 'string' ? stats.ctr : stats.ctr.toFixed(2)}%</div>
                  <div className={styles.statLabel}>Taux de Clic (CTR)</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIconWrapper} style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                  <FontAwesomeIcon icon={faCheckCircle} />
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{stats.conversions.toLocaleString()}</div>
                  <div className={styles.statLabel}>Conversions</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIconWrapper} style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                  <FontAwesomeIcon icon={faArrowTrendUp} />
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{typeof stats.conversionRate === 'string' ? stats.conversionRate : stats.conversionRate.toFixed(2)}%</div>
                  <div className={styles.statLabel}>Taux de Conversion</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIconWrapper} style={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }}>
                  <FontAwesomeIcon icon={faWallet} />
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>€{typeof stats.totalBudgetSpent === 'number' ? stats.totalBudgetSpent.toFixed(2) : stats.totalBudgetSpent}</div>
                  <div className={styles.statLabel}>Budget Dépensé</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TARGETING TAB */}
      {activeTab === 'targeting' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2><FontAwesomeIcon icon={faUsers} /> Configuration du Ciblage</h2>
            {!editingTarget && (
              <button className={styles.editBtn} onClick={() => setEditingTarget(true)}>
                <FontAwesomeIcon icon={faEdit} /> Modifier
              </button>
            )}
          </div>
          
          {!editingTarget && targeting && (
            <div className={styles.targetingView}>
              <div className={styles.targetingItem}>
                <FontAwesomeIcon icon={faUsers} className={styles.itemIcon} />
                <div className={styles.itemContent}>
                  <span className={styles.label}>Âge</span>
                  <span className={styles.value}>{targeting.minAge || '?'} - {targeting.maxAge || '?'} ans</span>
                </div>
              </div>
              <div className={styles.targetingItem}>
                <FontAwesomeIcon icon={faVenusMars} className={styles.itemIcon} />
                <div className={styles.itemContent}>
                  <span className={styles.label}>Genre</span>
                  <span className={styles.value}>
                    {targeting.gender === 'M' ? 'Hommes' : targeting.gender === 'F' ? 'Femmes' : 'Tous'}
                  </span>
                </div>
              </div>
              <div className={styles.targetingItem}>
                <FontAwesomeIcon icon={faGlobe} className={styles.itemIcon} />
                <div className={styles.itemContent}>
                  <span className={styles.label}>Pays</span>
                  <span className={styles.value}>{targeting.countries?.length > 0 ? targeting.countries.join(', ') : 'Tous'}</span>
                </div>
              </div>
              <div className={styles.targetingItem}>
                <FontAwesomeIcon icon={faCity} className={styles.itemIcon} />
                <div className={styles.itemContent}>
                  <span className={styles.label}>Villes</span>
                  <span className={styles.value}>{targeting.cities?.length > 0 ? targeting.cities.join(', ') : 'Toutes'}</span>
                </div>
              </div>
              <div className={styles.targetingItem}>
                <FontAwesomeIcon icon={faLightbulb} className={styles.itemIcon} />
                <div className={styles.itemContent}>
                  <span className={styles.label}>Intérêts</span>
                  <span className={styles.value}>{targeting.interests?.length > 0 ? targeting.interests.join(', ') : 'Aucun'}</span>
                </div>
              </div>
              <div className={styles.targetingItem}>
                <FontAwesomeIcon icon={faMobileAlt} className={styles.itemIcon} />
                <div className={styles.itemContent}>
                  <span className={styles.label}>Appareils</span>
                  <span className={styles.value}>{targeting.devices?.length > 0 ? targeting.devices.join(', ') : 'Tous'}</span>
                </div>
              </div>
            </div>
          )}

          {editingTarget && (
            <form className={styles.form} onSubmit={(e) => { e.preventDefault(); saveTargeting(); }}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label><FontAwesomeIcon icon={faUsers} /> Âge minimum</label>
                  <input
                    type="number"
                    placeholder="18"
                    value={targetForm.minAge}
                    onChange={(e) => setTargetForm({ ...targetForm, minAge: parseInt(e.target.value) || '' })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label><FontAwesomeIcon icon={faUsers} /> Âge maximum</label>
                  <input
                    type="number"
                    placeholder="65"
                    value={targetForm.maxAge}
                    onChange={(e) => setTargetForm({ ...targetForm, maxAge: parseInt(e.target.value) || '' })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label><FontAwesomeIcon icon={faVenusMars} /> Genre</label>
                <select value={targetForm.gender} onChange={(e) => setTargetForm({ ...targetForm, gender: e.target.value })}>
                  <option value="">Tous</option>
                  <option value="M">Hommes</option>
                  <option value="F">Femmes</option>
                  <option value="Other">Autre</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label><FontAwesomeIcon icon={faGlobe} /> Pays (séparés par virgules)</label>
                <input
                  placeholder="FR, DE, BE"
                  value={targetForm.countries?.join(', ') || ''}
                  onChange={(e) => setTargetForm({ ...targetForm, countries: e.target.value.split(',').map(c => c.trim()).filter(c => c) })}
                />
              </div>

              <div className={styles.formGroup}>
                <label><FontAwesomeIcon icon={faCity} /> Villes (séparées par virgules)</label>
                <input
                  placeholder="Paris, Lyon, Bruxelles"
                  value={targetForm.cities?.join(', ') || ''}
                  onChange={(e) => setTargetForm({ ...targetForm, cities: e.target.value.split(',').map(c => c.trim()).filter(c => c) })}
                />
              </div>

              <div className={styles.formGroup}>
                <label><FontAwesomeIcon icon={faLightbulb} /> Intérêts (séparés par virgules)</label>
                <input
                  placeholder="tech, musique, sport"
                  value={targetForm.interests?.join(', ') || ''}
                  onChange={(e) => setTargetForm({ ...targetForm, interests: e.target.value.split(',').map(i => i.trim()).filter(i => i) })}
                />
              </div>

              <div className={styles.formGroup}>
                <label><FontAwesomeIcon icon={faMobileAlt} /> Appareils</label>
                <div className={styles.checkboxGroup}>
                  {['mobile', 'desktop', 'tablet'].map(device => (
                    <label key={device} className={styles.checkbox}>
                      <input
                        type="checkbox"
                        checked={targetForm.devices?.includes(device) || false}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTargetForm({ ...targetForm, devices: [...(targetForm.devices || []), device] });
                          } else {
                            setTargetForm({ ...targetForm, devices: (targetForm.devices || []).filter(d => d !== device) });
                          }
                        }}
                      />
                      {device === 'mobile' && <><FontAwesomeIcon icon={faMobileAlt} /> Mobile</>}
                      {device === 'desktop' && <><FontAwesomeIcon icon={faDesktop} /> Desktop</>}
                      {device === 'tablet' && <><FontAwesomeIcon icon={faTabletAlt} /> Tablet</>}
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="submit" className={styles.btnPrimary}>
                  <FontAwesomeIcon icon={faCheck} /> Enregistrer
                </button>
                <button type="button" onClick={() => setEditingTarget(false)} className={styles.btnSecondary}>
                  <FontAwesomeIcon icon={faTimes} /> Annuler
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* QUOTAS TAB */}
      {activeTab === 'quotas' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2><FontAwesomeIcon icon={faWallet} /> Configuration des Quotas</h2>
            {!editingQuota && (
              <button className={styles.editBtn} onClick={() => setEditingQuota(true)}>
                <FontAwesomeIcon icon={faEdit} /> Modifier
              </button>
            )}
          </div>

          {!editingQuota && quotas && (
            <div className={styles.quotasView}>
              <div className={styles.quotaCard}>
                <h3><FontAwesomeIcon icon={faWallet} /> Budget</h3>
                <div className={styles.quotaItem}>
                  <span className={styles.label}>Quotidien :</span>
                  <span className={styles.value}>€{quotas.dailyBudgetLimit || '∞'}</span>
                  <span className={styles.spent}>Dépensé : €{quotas.budgetSpentToday.toFixed(2)}</span>
                </div>
                <div className={styles.quotaItem}>
                  <span className={styles.label}>Mensuel :</span>
                  <span className={styles.value}>€{quotas.monthlyBudgetLimit || '∞'}</span>
                  <span className={styles.spent}>Dépensé : €{quotas.budgetSpentMonth.toFixed(2)}</span>
                </div>
                <div className={styles.quotaItem}>
                  <span className={styles.label}>Total :</span>
                  <span className={styles.value}>€{quotas.totalBudgetLimit || '∞'}</span>
                </div>
              </div>

              <div className={styles.quotaCard}>
                <h3><FontAwesomeIcon icon={faChartPie} /> Impressions</h3>
                <div className={styles.quotaItem}>
                  <span className={styles.label}>Quotidienne :</span>
                  <span className={styles.value}>{quotas.dailyImpressionLimit || '∞'}</span>
                  <span className={styles.spent}>Atteint : {quotas.impressionsToday}</span>
                </div>
                <div className={styles.quotaItem}>
                  <span className={styles.label}>Mensuelle :</span>
                  <span className={styles.value}>{quotas.monthlyImpressionLimit || '∞'}</span>
                  <span className={styles.spent}>Atteint : {quotas.impressionsMonth}</span>
                </div>
              </div>

              <div className={styles.quotaCard}>
                <h3><FontAwesomeIcon icon={faCog} /> Statut</h3>
                <div className={styles.statusItem}>
                  <span className={styles.label}>Activation :</span>
                  <span className={quotas.active ? styles.statusActive : styles.statusInactive}>
                    <FontAwesomeIcon icon={quotas.active ? faToggleOn : faToggleOff} /> {quotas.active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.label}>Quota dépassé :</span>
                  <span className={quotas.quotaExceeded ? styles.statusError : styles.statusSuccess}>
                    <FontAwesomeIcon icon={quotas.quotaExceeded ? faExclamationTriangle : faCheckCircle} /> {quotas.quotaExceeded ? 'Oui' : 'Non'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {editingQuota && (
            <form className={styles.form} onSubmit={(e) => { e.preventDefault(); saveQuota(); }}>
              <div className={styles.formSection}>
                <h3><FontAwesomeIcon icon={faWallet} /> Budget</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Budget quotidien (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="50"
                      value={quotaForm.dailyBudgetLimit || ''}
                      onChange={(e) => setQuotaForm({ ...quotaForm, dailyBudgetLimit: parseFloat(e.target.value) || null })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Budget mensuel (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="1000"
                      value={quotaForm.monthlyBudgetLimit || ''}
                      onChange={(e) => setQuotaForm({ ...quotaForm, monthlyBudgetLimit: parseFloat(e.target.value) || null })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Budget total (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="5000"
                      value={quotaForm.totalBudgetLimit || ''}
                      onChange={(e) => setQuotaForm({ ...quotaForm, totalBudgetLimit: parseFloat(e.target.value) || null })}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formSection}>
                <h3><FontAwesomeIcon icon={faChartPie} /> Impressions</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Quotidienne</label>
                    <input
                      type="number"
                      placeholder="1000"
                      value={quotaForm.dailyImpressionLimit || ''}
                      onChange={(e) => setQuotaForm({ ...quotaForm, dailyImpressionLimit: parseInt(e.target.value) || null })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Mensuelle</label>
                    <input
                      type="number"
                      placeholder="30000"
                      value={quotaForm.monthlyImpressionLimit || ''}
                      onChange={(e) => setQuotaForm({ ...quotaForm, monthlyImpressionLimit: parseInt(e.target.value) || null })}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={quotaForm.active}
                    onChange={(e) => setQuotaForm({ ...quotaForm, active: e.target.checked })}
                  />
                  <FontAwesomeIcon icon={faToggleOn} /> Sponsor actif
                </label>
              </div>

              <div className={styles.formActions}>
                <button type="submit" className={styles.btnPrimary}>
                  <FontAwesomeIcon icon={faCheck} /> Enregistrer
                </button>
                <button type="button" onClick={() => setEditingQuota(false)} className={styles.btnSecondary}>
                  <FontAwesomeIcon icon={faTimes} /> Annuler
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
