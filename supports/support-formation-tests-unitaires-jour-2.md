# SUPPORT DE COURS — TESTS UNITAIRES · JOUR 2

> **Formation** : Tests unitaires (jour 2) — approfondissement et stratégie
> **Public** : Développeurs, QA techniques, Tech leads
> **Outils** : Vitest · Cucumber.js + Gherkin · Playwright · fast-check · Stryker · MSW
> **Projet fil rouge** : **Hawkins Lab Escape** — RPG tour par tour en TypeScript
> **Prérequis** : Journée 1 (fondations testing, AAA, mocks, DI, TDD, intro BDD)
> **Note** : la génération de tests avec l'IA (Cursor, Claude Code) fait l'objet d'une formation dédiée d'1 jour et n'est pas couverte ici.

---

## 🔁 Récap rapide de la journée 1

À l'issue du J1, les participants maîtrisent :
- **Le vocabulaire et l'intention** : pourquoi tester, niveaux de tests, anti-patterns
- **L'écriture d'un bon test** : nommage, AAA, comportement vs implémentation
- **Les doubles de test** : dummy, stub, spy, mock, fake
- **L'architecture testable** : injection de dépendance, abstractions
- **Le TDD** : boucle Red-Green-Refactor
- **L'intro BDD** : Gherkin, step definitions, premier scénario

Aujourd'hui, on **monte en niveau** : techniques avancées de mocking, tests d'intégration, property-based testing, métriques de qualité, BDD avancé, E2E avec Playwright, et orchestration d'une stratégie de tests cohérente.

**⚠️ Note durée** : ce J2 contient 7 modules. À 7h de formation, on dépasse l'enveloppe initiale — le formateur peut soit étirer sur 8-9h, soit faire passer un module (typiquement 6 ou 7) en autonomie pour les stagiaires.

---

# 🌅 MATIN

---

## Module 4 — Techniques avancées de mocking

### 4.1 — Fake timers et contrôle du temps

#### 📖 Détail

Le temps est l'un des ennemis les plus retors du testing. Dès qu'une fonction utilise `setTimeout`, `setInterval`, `Date.now()` ou des Promesses différées, elle introduit du non-déterminisme et de la lenteur dans les tests. Un test qui attend vraiment 5 secondes pour valider un timeout devient un test qu'on n'exécute plus en TDD. La solution : **les fake timers**, qui permettent de contrôler le temps comme on contrôle n'importe quelle autre dépendance.

Vitest expose une API complète héritée de Sinon : `vi.useFakeTimers()`, `vi.advanceTimersByTime(ms)`, `vi.runAllTimers()`, `vi.useRealTimers()`. Le principe : on remplace les fonctions globales (`setTimeout`, `setInterval`, `Date`, `performance.now`) par des versions contrôlées par le test. Au lieu d'attendre que le temps passe, on l'avance manuellement.

**Quand utiliser les fake timers ?**

1. **Tester un debounce/throttle** : une fonction qui ne s'exécute que toutes les 500 ms (ex. autosave après inactivité)
2. **Tester un timeout** : « après 3 secondes sans action, le combat passe automatiquement au tour de l'ennemi »
3. **Tester un polling** : « toutes les 10 secondes, vérifier si une notification est arrivée »
4. **Tester l'expiration d'un effet** : « le buff "speed" disparaît après 30 secondes »
5. **Tester des dates absolues** : « la sauvegarde se purge si elle a plus de 30 jours »

**Les pièges classiques** :

- **Oublier `useRealTimers` en fin de test** : si on garde les fake timers actifs entre tests, on pollue tout. Utiliser `afterEach(() => vi.useRealTimers())` ou la config `restoreMocks: true` dans Vitest.
- **Confondre `advanceTimersByTime` et `runAllTimers`** : le premier avance d'un délai précis, le second exécute tous les timers en attente jusqu'à ce qu'il n'en reste plus. `runAllTimers` peut boucler à l'infini si un timer en programme un autre.
- **Oublier `await` quand on combine fake timers et Promesses** : `vi.advanceTimersByTime(1000)` ne déclenche pas l'exécution des microtâches. Il faut souvent ajouter un `await Promise.resolve()` ou utiliser `vi.advanceTimersByTimeAsync`.
- **Mock global de `Date`** : remplace `new Date()` mais pas forcément `Date.now()` selon les versions. Tester explicitement.

**Cas avancé : le système de buff temporaire**. Dans Hawkins Lab Escape, un sort « Aura psychique » donne un buff de +20 attaque pendant 30 secondes en temps réel. Sans fake timers, le test devrait attendre 30 secondes. Inacceptable. Avec les fake timers, le test prend 5 millisecondes et reste totalement déterministe.

**Combinaison avec l'injection de dépendance** : pour les tests d'unités pures (sans `setTimeout`), on préfère injecter une horloge plutôt que d'utiliser fake timers. Une fonction qui prend `now: () => Date` en paramètre est plus testable qu'une fonction qui appelle `Date.now()` en interne. Les fake timers restent utiles pour les cas où on ne peut pas (ou ne veut pas) refactorer la signature.

**Performance** : les fake timers sont gratuits. On peut « avancer » de 10 ans en mémoire en quelques microsecondes. C'est un superpouvoir qu'il faut exploiter sans modération dès qu'on touche au temps. Un projet qui n'utilise pas les fake timers a soit des tests très lents, soit des tests qui ne testent pas vraiment les comportements temporels.

#### 🧩 Exemple concret

```typescript
// src/domain/buff.service.ts
export class BuffService {
  private buffs: Array<{ id: string; expiresAt: number }> = [];

  applyBuff(id: string, durationMs: number, now: () => number = Date.now) {
    this.buffs.push({ id, expiresAt: now() + durationMs });
  }

  isActive(id: string, now: () => number = Date.now): boolean {
    return this.buffs.some(b => b.id === id && b.expiresAt > now());
  }

  cleanupExpired(now: () => number = Date.now) {
    this.buffs = this.buffs.filter(b => b.expiresAt > now());
  }
}

// tests/unit/buff.service.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BuffService } from '../../src/domain/buff.service';

describe('BuffService avec fake timers', () => {
  beforeEach(() => vi.useFakeTimers({ now: new Date('2025-01-01T00:00:00Z') }));
  afterEach(() => vi.useRealTimers());

  it('active le buff immédiatement après application', () => {
    // Arrange
    const service = new BuffService();

    // Act
    service.applyBuff('aura-psychique', 30_000);

    // Assert
    expect(service.isActive('aura-psychique')).toBe(true);
  });

  it('désactive le buff après expiration de la durée', () => {
    // Arrange
    const service = new BuffService();
    service.applyBuff('aura-psychique', 30_000);

    // Act
    vi.advanceTimersByTime(31_000);

    // Assert
    expect(service.isActive('aura-psychique')).toBe(false);
  });

  it('reste actif tant qu\'on n\'a pas atteint l\'expiration', () => {
    // Arrange
    const service = new BuffService();
    service.applyBuff('aura-psychique', 30_000);

    // Act
    vi.advanceTimersByTime(29_999);

    // Assert
    expect(service.isActive('aura-psychique')).toBe(true);
  });
});
```

#### 🎯 Exercice rapide

**« Tester un système d'autosave avec debounce »** — Voici une fonction qui sauvegarde automatiquement 2 secondes après la dernière action du joueur (debounce). Écris 3 tests qui valident :
1. Pas de sauvegarde immédiate
2. Sauvegarde déclenchée 2 secondes après une action unique
3. Pas de sauvegarde si une nouvelle action survient avant les 2 secondes (reset du debounce)

```typescript
export class Autosave {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(private save: () => void, private delayMs: number = 2000) {}

  onAction() {
    if (this.timeoutId !== null) clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => this.save(), this.delayMs);
  }
}
```

#### ✅ Correction

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Autosave } from '../../src/domain/autosave';

describe('Autosave (debounce)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('ne sauvegarde pas immédiatement après une action', () => {
    // Arrange
    const saveSpy = vi.fn();
    const autosave = new Autosave(saveSpy, 2000);

    // Act
    autosave.onAction();

    // Assert
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('sauvegarde 2 secondes après une action unique', () => {
    // Arrange
    const saveSpy = vi.fn();
    const autosave = new Autosave(saveSpy, 2000);
    autosave.onAction();

    // Act
    vi.advanceTimersByTime(2000);

    // Assert
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it('annule le timer précédent si une nouvelle action survient avant l\'expiration', () => {
    // Arrange
    const saveSpy = vi.fn();
    const autosave = new Autosave(saveSpy, 2000);
    autosave.onAction();

    // Act
    vi.advanceTimersByTime(1500); // pas encore expiré
    autosave.onAction(); // reset
    vi.advanceTimersByTime(1500); // toujours pas expiré (1500 ms depuis le reset)

    // Assert
    expect(saveSpy).not.toHaveBeenCalled();

    // Vérifier qu'il finit bien par sauvegarder après 2s du dernier reset
    vi.advanceTimersByTime(500);
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });
});
```

#### 🚀 Pistes d'exercices avancés

1. **Tester un système de tour limité dans le temps** — Dans Hawkins Lab Escape, ajoute une règle « le joueur a 10 secondes pour choisir son action, sinon le tour passe automatiquement ». Implémente la fonctionnalité en TDD avec fake timers, en couvrant les cas : choix dans les temps, choix exactement à 10s, expiration silencieuse, action différée pendant qu'une animation tourne.
2. **Mock partiel de l'horloge** — Crée un test où on a besoin de `Date.now()` qui avance normalement, mais `setTimeout` qui reste contrôlé. Utilise `vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval'] })` pour n'intercepter que certaines APIs. Documente les cas où cette granularité est utile.

---

### 4.2 — Mocker le réseau avec MSW (Mock Service Worker)

#### 📖 Détail

Dès qu'une application communique avec un backend (leaderboard, achievements partagés, sauvegarde cloud), les tests doivent gérer cette frontière. Les approches naïves — mocker `fetch` directement, espionner `axios`, intercepter manuellement chaque appel — sont fragiles et ne testent pas la réalité de la couche réseau. **MSW (Mock Service Worker)** propose une approche radicalement meilleure : intercepter les requêtes HTTP **au niveau du runtime**, sans toucher au code applicatif.

Le principe : MSW agit comme un faux serveur. On définit des « handlers » qui décrivent comment répondre à des routes HTTP (« GET /api/leaderboard → 200 avec ce JSON »). Le code testé fait de vrais appels `fetch` ou `axios` — il ne sait pas qu'il parle à un mock. C'est la même approche qui rend les tests proches de la production tout en gardant le déterminisme et la vitesse.

**Avantages décisifs** :

1. **Aucune modification du code de production** : pas besoin d'injecter un `HttpClient` partout. Le code utilise `fetch` natif, MSW l'intercepte de manière transparente.
2. **Réutilisable entre unit, intégration, E2E** : les mêmes handlers peuvent servir aux tests Vitest (Node) et aux tests Playwright (navigateur).
3. **Composition de scénarios** : on peut overrider un handler dans un test précis pour simuler une erreur, sans toucher aux autres tests.
4. **Documentation vivante de l'API** : la collection de handlers décrit le contrat de l'API.

**Installation et configuration de base** :

```bash
npm install --save-dev msw
```

```typescript
// tests/msw/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/leaderboard', () => {
    return HttpResponse.json([
      { name: 'Eleven', score: 9999 },
      { name: 'Mike', score: 8500 },
    ]);
  }),

  http.post('/api/save', async ({ request }) => {
    const body = await request.json() as { slot: number; state: unknown };
    return HttpResponse.json({ savedAt: new Date().toISOString(), slot: body.slot });
  }),

  http.get('/api/character/:id', ({ params }) => {
    if (params.id === 'unknown') {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json({ id: params.id, name: 'Eleven', level: 5 });
  }),
];
```

```typescript
// tests/msw/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

```typescript
// vitest.setup.ts
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './tests/msw/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

L'option `onUnhandledRequest: 'error'` est précieuse : elle fait échouer tout test qui ferait un appel HTTP non-mocké. Garantit qu'aucun test ne touche au vrai réseau accidentellement.

**Override d'un handler dans un test précis** :

```typescript
import { server } from '../msw/server';
import { http, HttpResponse } from 'msw';

it('affiche un message d\'erreur quand le leaderboard est indisponible', async () => {
  // Override pour ce test uniquement
  server.use(
    http.get('/api/leaderboard', () => new HttpResponse(null, { status: 503 }))
  );

  const result = await fetchLeaderboard();

  expect(result.error).toBe('Service unavailable');
});
```

Après le test, `afterEach(() => server.resetHandlers())` restaure les handlers par défaut.

**Cas avancés** :

1. **Délai de réponse** : `await delay(500)` dans le handler pour simuler une lenteur réseau et tester le loading state.
2. **Réponse différente selon le nombre d'appels** : utiliser un compteur fermé sur le handler pour simuler un retry qui finit par réussir.
3. **Vérifier les requêtes envoyées** : MSW expose `server.events.on('request:start', ...)` pour observer ce qui passe par le réseau.
4. **WebSockets** : MSW v2+ supporte le mocking de WebSockets pour les jeux temps réel.

**Anti-patterns à éviter** :

- **Mélanger MSW et `vi.mock` sur `fetch`** : un seul mécanisme à la fois, sinon comportements imprévisibles.
- **Handlers trop permissifs** : un handler qui matche `*` n'aide pas à détecter les bugs de routing.
- **Données de mock dupliquées partout** : centraliser dans `tests/msw/fixtures/` avec des factories.

**MSW vs autres approches** :

| Approche | Coût | Fidélité | Réutilisable | Recommandé pour |
|---|---|---|---|---|
| `vi.fn().mockResolvedValue(...)` | Faible | Faible | Non | Tests unitaires d'orchestration |
| Injection de `HttpClient` | Moyen | Moyenne | Limité | Architecture déjà DI partout |
| **MSW** | Moyen | **Élevée** | **Oui** | **Tests d'intégration et E2E** |
| Vrai backend de test | Élevé | Très élevée | Oui | Tests de bout en bout |

Pour Hawkins Lab Escape qui aura probablement un backend leaderboard et achievements, MSW est l'outil de référence à apprendre.

#### 🧩 Exemple concret

```typescript
// src/services/leaderboard.service.ts
export class LeaderboardService {
  async fetchTop10(): Promise<Entry[]> {
    const res = await fetch('/api/leaderboard');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async submitScore(name: string, score: number): Promise<void> {
    const res = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }
}

// tests/integration/leaderboard.service.test.ts
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import { LeaderboardService } from '../../src/services/leaderboard.service';

describe('LeaderboardService', () => {
  it('récupère les entrées du leaderboard', async () => {
    // Arrange
    const service = new LeaderboardService();

    // Act
    const entries = await service.fetchTop10();

    // Assert
    expect(entries).toHaveLength(2);
    expect(entries[0].name).toBe('Eleven');
  });

  it('lève une erreur quand le serveur retourne 503', async () => {
    // Arrange
    server.use(
      http.get('/api/leaderboard', () => new HttpResponse(null, { status: 503 }))
    );
    const service = new LeaderboardService();

    // Act + Assert
    await expect(service.fetchTop10()).rejects.toThrow('HTTP 503');
  });

  it('soumet un score avec les bonnes données', async () => {
    // Arrange
    let capturedBody: unknown;
    server.use(
      http.post('/api/leaderboard', async ({ request }) => {
        capturedBody = await request.json();
        return new HttpResponse(null, { status: 201 });
      })
    );
    const service = new LeaderboardService();

    // Act
    await service.submitScore('Eleven', 9999);

    // Assert
    expect(capturedBody).toEqual({ name: 'Eleven', score: 9999 });
  });
});
```

#### 🎯 Exercice rapide

**« Tester un service d'achievements avec MSW »** — Écris une classe `AchievementService` qui appelle `GET /api/achievements/:userId` et retourne la liste des achievements. Implémente avec MSW les tests pour :
1. Récupération réussie d'une liste de 3 achievements
2. Utilisateur inconnu (404)
3. Timeout réseau (simule avec un délai très long ou un `network error`)

#### ✅ Correction

```typescript
// src/services/achievement.service.ts
export interface Achievement {
  id: string;
  name: string;
  unlockedAt: string;
}

export class AchievementService {
  async fetchFor(userId: string): Promise<Achievement[]> {
    const res = await fetch(`/api/achievements/${userId}`);
    if (res.status === 404) return [];
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
}

// tests/msw/handlers.ts (ajout)
http.get('/api/achievements/:userId', ({ params }) => {
  if (params.userId === 'unknown') return new HttpResponse(null, { status: 404 });
  return HttpResponse.json([
    { id: 'first-blood', name: 'Première victoire', unlockedAt: '2025-01-01' },
    { id: 'collector', name: 'Collectionneur', unlockedAt: '2025-01-05' },
    { id: 'survivor', name: 'Survivant', unlockedAt: '2025-01-10' },
  ]);
}),

// tests/integration/achievement.service.test.ts
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import { AchievementService } from '../../src/services/achievement.service';

describe('AchievementService', () => {
  const service = new AchievementService();

  it('récupère les achievements d\'un utilisateur connu', async () => {
    const result = await service.fetchFor('eleven');
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('first-blood');
  });

  it('retourne une liste vide pour un utilisateur inconnu (404)', async () => {
    const result = await service.fetchFor('unknown');
    expect(result).toEqual([]);
  });

  it('lève une erreur en cas de network error', async () => {
    server.use(
      http.get('/api/achievements/:userId', () => HttpResponse.error())
    );

    await expect(service.fetchFor('eleven')).rejects.toThrow();
  });
});
```

#### 🚀 Pistes d'exercices avancés

1. **MSW pour les tests E2E Playwright** — Réutilise les mêmes handlers MSW dans les tests Playwright avec le service worker dans le navigateur. Documente la mise en place : initialisation du worker, désactivation en production, gestion des routes manquantes. Bénéfice : tu testes l'UI sans dépendre d'un backend réel.
2. **Simulation d'un retry exponentiel** — Implémente un `LeaderboardService` qui retente automatiquement jusqu'à 3 fois avec backoff exponentiel (100ms, 200ms, 400ms). Avec MSW + fake timers, écris un test qui vérifie : les 3 tentatives ont lieu, le délai entre tentatives est respecté, après 3 échecs l'erreur est propagée. Combinaison MSW + fake timers = puissance.

---

### 4.3 — Fixtures et builders : structurer les données de test

#### 📖 Détail

Au-delà de quelques tests, les structures de données de test deviennent un cauchemar à maintenir : objets répétés, valeurs en dur, oublis qui rendent les tests fragiles. La discipline qui sauve : **structurer les données de test avec des fixtures et des builders**. C'est l'une des différences les plus visibles entre une suite de tests amateur et une suite professionnelle.

**Trois patterns complémentaires** :

**1. Factories simples** (vues en J1) — fonctions qui créent un objet avec des valeurs par défaut surchargeables :

```typescript
export const makeCharacter = (overrides = {}): Character => ({
  id: 'eleven',
  name: 'Eleven',
  stats: { hp: 100, maxHp: 100, attack: 10, defense: 5, energy: 50, maxEnergy: 50 },
  inventory: [],
  abilities: [],
  statusEffects: [],
  ...overrides,
});
```

Avantages : simple, suffit dans 80 % des cas. Inconvénients : ne gère pas les dépendances entre champs (si `hp > maxHp`, c'est incohérent), pas de DSL fluide.

**2. Builders fluents** — pattern objet qui chaîne des configurations :

```typescript
export class CharacterBuilder {
  private character: Character = makeCharacter();

  named(name: string) { this.character.name = name; return this; }
  withHp(hp: number) { this.character.stats.hp = hp; return this; }
  atFullHealth() { this.character.stats.hp = this.character.stats.maxHp; return this; }
  withAbility(ability: Ability) { this.character.abilities.push(ability); return this; }
  stunned() {
    this.character.statusEffects.push({ id: 'stunned', remainingTurns: 2 });
    return this;
  }
  dead() { this.character.stats.hp = 0; return this; }
  build(): Character { return { ...this.character }; }
}

export const aCharacter = () => new CharacterBuilder();
```

Utilisation :
```typescript
const eleven = aCharacter()
  .named('Eleven')
  .withHp(75)
  .withAbility(makeAbility({ name: 'Psychic Blast' }))
  .stunned()
  .build();
```

Avantages : narrativement lisible (« a character named Eleven with hp 75 and stunned »), valide les invariants dans le builder, encapsule la complexité. Inconvénients : plus de code à maintenir.

**3. Fixtures partagées** — objets pré-construits exportés depuis un fichier central :

```typescript
// tests/fixtures/characters.ts
export const ELEVEN = makeCharacter({ id: 'eleven', name: 'Eleven', attack: 15 });
export const MIKE = makeCharacter({ id: 'mike', name: 'Mike', attack: 8 });
export const DUSTIN = makeCharacter({ id: 'dustin', name: 'Dustin', attack: 6 });

// tests/fixtures/enemies.ts
export const DEMOGORGON = makeEnemy({ name: 'Demogorgon', hp: 50, defense: 3 });
export const MIND_FLAYER = makeEnemy({ name: 'Mind Flayer', hp: 500, defense: 20 });

// tests/fixtures/abilities.ts
export const PSYCHIC_BLAST = makeAbility({ name: 'Psychic Blast', baseDamage: 30, energyCost: 15 });
```

Utilisation :
```typescript
import { ELEVEN, DEMOGORGON, PSYCHIC_BLAST } from '../fixtures';

it('inflige 42 dégâts avec Psychic Blast', () => {
  expect(calculateDamage(ELEVEN, DEMOGORGON, PSYCHIC_BLAST)).toBe(42);
});
```

Avantages : réutilisation maximale, lisibilité immédiate. Inconvénients : fixtures qui dérivent ensemble (si on change `ELEVEN.attack`, on impacte 50 tests).

**Quand utiliser quel pattern ?**

- **Factory** : par défaut, pour 90 % des cas
- **Builder** : quand le test a besoin de construire un objet complexe avec plusieurs configurations, ou quand on veut un DSL narratif
- **Fixture partagée** : pour des entités vraiment canoniques (l'ennemi de boss principal, le personnage de référence) — à utiliser avec parcimonie

**Anti-patterns** :

1. **Le `mockify` global** : un objet géant `mockData.ts` avec 500 lignes — illisible et qui couple tous les tests.
2. **Le builder qui valide trop tard** : un builder qui accepte n'importe quoi et qui plante au `build()` — préférer valider à chaque méthode.
3. **Le `beforeEach` qui construit tout** : on perd le pouvoir d'exprimer le contexte spécifique de chaque test.
4. **L'objet partagé muté entre tests** : si un test modifie une fixture importée, le test suivant est pollué. Toujours retourner une **copie** dans les factories/builders.

**Cas Hawkins Lab Escape** : on combine les trois patterns selon le contexte.
- Factory `makeCharacter` pour la souplesse maximale
- Builder `aCharacter()` quand on veut un test narratif sur un personnage complexe
- Fixtures `DEMOGORGON`, `MIND_FLAYER` pour les ennemis canoniques de référence

**Property-based testing et builders** : excellent combo. Le builder définit ce qu'est un personnage « valide », `fast-check` génère 100 personnages aléatoires conformes au builder, on vérifie une propriété. Cf. module 5.

#### 🧩 Exemple concret

```typescript
// tests/builders/character.builder.ts
import type { Character, Ability, StatusEffect } from '../../src/domain/character';
import { makeCharacter, makeAbility } from '../helpers/factories';

export class CharacterBuilder {
  private c: Character;

  constructor() {
    this.c = makeCharacter();
  }

  named(name: string): this {
    this.c.name = name;
    this.c.id = name.toLowerCase();
    return this;
  }

  withHp(hp: number): this {
    if (hp < 0) throw new Error('HP cannot be negative');
    this.c.stats.hp = hp;
    if (hp > this.c.stats.maxHp) this.c.stats.maxHp = hp;
    return this;
  }

  withMaxHp(maxHp: number): this {
    this.c.stats.maxHp = maxHp;
    if (this.c.stats.hp > maxHp) this.c.stats.hp = maxHp;
    return this;
  }

  dead(): this { return this.withHp(0); }
  atFullHealth(): this { return this.withHp(this.c.stats.maxHp); }
  woundedAt(percent: number): this {
    return this.withHp(Math.floor(this.c.stats.maxHp * percent / 100));
  }

  withAbility(ability: Partial<Ability> = {}): this {
    this.c.abilities.push(makeAbility(ability));
    return this;
  }

  stunned(turns = 2): this {
    this.c.statusEffects.push({ id: 'stunned', remainingTurns: turns });
    return this;
  }

  poisoned(turns = 3): this {
    this.c.statusEffects.push({ id: 'poisoned', remainingTurns: turns });
    return this;
  }

  build(): Character {
    return JSON.parse(JSON.stringify(this.c)); // deep clone pour éviter pollution
  }
}

export const aCharacter = () => new CharacterBuilder();

// Utilisation dans un test
import { aCharacter } from '../builders/character.builder';

it('un personnage étourdi ne peut pas attaquer même à pleine santé', () => {
  const eleven = aCharacter()
    .named('Eleven')
    .atFullHealth()
    .stunned()
    .withAbility({ name: 'Psychic Blast' })
    .build();

  expect(canAttack(eleven)).toBe(false);
});

it('un personnage à 25% de PV peut encore agir s\'il n\'est pas étourdi', () => {
  const eleven = aCharacter()
    .named('Eleven')
    .withMaxHp(100)
    .woundedAt(25)
    .build();

  expect(canAttack(eleven)).toBe(true);
  expect(eleven.stats.hp).toBe(25);
});
```

#### 🎯 Exercice rapide

**« Construire un EnemyBuilder »** — Implémente une classe `EnemyBuilder` avec les méthodes : `named(name)`, `withHp(hp)`, `withDefense(d)`, `boss()` (raccourci pour un ennemi très résistant), `weakenedTo(percent)`. Écris ensuite un test qui utilise le builder pour créer un boss à 10 % de PV.

#### ✅ Correction

```typescript
// tests/builders/enemy.builder.ts
import type { Enemy } from '../../src/domain/enemy';
import { makeEnemy } from '../helpers/factories';

export class EnemyBuilder {
  private e: Enemy;

  constructor() {
    this.e = makeEnemy();
  }

  named(name: string): this {
    this.e.name = name;
    this.e.id = name.toLowerCase().replace(/\s+/g, '-');
    return this;
  }

  withHp(hp: number): this {
    this.e.hp = hp;
    if (hp > this.e.maxHp) this.e.maxHp = hp;
    return this;
  }

  withDefense(d: number): this {
    this.e.defense = d;
    return this;
  }

  boss(): this {
    this.e.hp = 500;
    this.e.maxHp = 500;
    this.e.defense = 30;
    this.e.attack = 50;
    return this;
  }

  weakenedTo(percent: number): this {
    this.e.hp = Math.floor(this.e.maxHp * percent / 100);
    return this;
  }

  build(): Enemy {
    return { ...this.e };
  }
}

export const anEnemy = () => new EnemyBuilder();

// Test d'utilisation
it('un boss à 10% de PV reste menaçant grâce à sa haute défense', () => {
  const mindFlayer = anEnemy()
    .named('Mind Flayer')
    .boss()
    .weakenedTo(10)
    .build();

  expect(mindFlayer.hp).toBe(50);
  expect(mindFlayer.maxHp).toBe(500);
  expect(mindFlayer.defense).toBe(30);
  expect(mindFlayer.attack).toBe(50);
});
```

#### 🚀 Pistes d'exercices avancés

1. **Builder composite** — Crée un `CombatScenarioBuilder` qui orchestre `CharacterBuilder`, `EnemyBuilder` et un setup de combat. Exemple d'usage : `aCombat().with(aCharacter().named('Eleven').withHp(50)).against(anEnemy().boss()).inLocation('lab').build()`. Évalue l'impact sur la lisibilité de scénarios complexes.
2. **Génération automatique de fixtures via TypeScript** — Utilise les types TS pour générer automatiquement des factories depuis une interface (via un script ou un package comme `@faker-js/faker` typé). Génère 50 personnages aléatoires pour des tests de propriété (préparation au module 5).

---

## Module 5 — Property-based testing avec fast-check

### 5.1 — Du test par l'exemple au test par propriété

#### 📖 Détail

Tous les tests qu'on a écrits jusqu'ici sont des **tests par l'exemple** : on choisit des valeurs concrètes, on vérifie le résultat attendu. C'est efficace mais limité par notre imagination. On teste les cas auxquels on pense — pas ceux qu'on ne voit pas. Combien de bugs production révèlent des cas que personne n'avait imaginés ? La quasi-totalité.

Le **property-based testing** (PBT) renverse l'approche. Au lieu de tester « `calculateDamage(eleven, demogorgon, blast) === 15` », on teste « **pour tous les personnages et tous les ennemis, le résultat de `calculateDamage` est toujours ≥ 1** ». L'outil (`fast-check` en TypeScript) génère ensuite 100, 1000, 10000 cas aléatoires conformes au type d'entrée, et vérifie que la propriété tient. S'il trouve un contre-exemple, il **shrink** : il simplifie le contre-exemple jusqu'à isoler la plus petite entrée qui casse la propriété.

Cette approche, popularisée par QuickCheck en Haskell (1999) puis portée dans tous les langages, change radicalement la nature des bugs détectés. Les bugs trouvés par PBT sont presque toujours **des bugs subtils que les humains n'auraient jamais générés** : tableau vide, chaîne avec un caractère unicode, nombre négatif zéro, NaN, ordre de tri instable, race condition entre opérations commutatives.

**Quand utiliser le PBT ?**

1. **Fonctions pures avec invariants clairs** : tri, sérialisation, transformations de données
2. **Calculs métier avec bornes** : « les PV restent dans [0, maxHp] »
3. **Opérations idempotentes** : « `f(f(x)) === f(x)` »
4. **Roundtrips** : « `parse(serialize(x)) === x` »
5. **Lois algébriques** : commutativité, associativité, identité

**Quand ne pas utiliser le PBT ?**

1. **Code avec effets de bord complexes** : difficile d'exprimer la propriété
2. **Logique avec beaucoup de branches conditionnelles spécifiques** : un test par l'exemple est plus clair
3. **Performance critique** : 1000 itérations × test = très long si le test est lourd
4. **Code dont la spec est exprimée par cas** : forcer une propriété est artificiel

**Installation et premier test** :

```bash
npm install --save-dev fast-check
```

```typescript
import { describe, it } from 'vitest';
import * as fc from 'fast-check';

describe('calculateDamage (propriétés)', () => {
  it('inflige toujours au moins 1 point de dégât', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),  // attaque
        fc.integer({ min: 0, max: 200 }),  // défense
        fc.integer({ min: 1, max: 50 }),   // baseDamage
        (attack, defense, baseDamage) => {
          const eleven = makeCharacter({ attack });
          const enemy = makeEnemy({ defense });
          const ability = makeAbility({ baseDamage });

          const damage = calculateDamage(eleven, enemy, ability);

          return damage >= 1;
        }
      )
    );
  });
});
```

Sortie en cas d'échec :
```
Property failed after 23 tests
{ seed: 42, path: "5:3:1", endOnFailure: true }
Counterexample: [0, 0, 0]
Shrunk 7 time(s)
Got error: Property failed by returning false
```

L'outil dit : « avec attack=0, defense=0, baseDamage=0, ta propriété échoue ». On a découvert un cas limite oublié.

**Les arbitraires (`arbitrary`)** sont les générateurs de données aléatoires. Liste utile :
- `fc.integer({ min, max })` : entier dans un intervalle
- `fc.float({ min, max, noNaN: true })` : flottant
- `fc.string()` : chaîne UTF-8 quelconque
- `fc.array(fc.integer(), { minLength: 0, maxLength: 100 })` : tableau
- `fc.record({ name: fc.string(), age: fc.nat() })` : objet typé
- `fc.option(fc.integer())` : valeur ou null
- `fc.oneof(fc.constant('a'), fc.constant('b'))` : un parmi
- `fc.tuple(fc.integer(), fc.string())` : tuple

**Stratégies de propriétés** :

1. **Invariants** : « après l'opération, propriété X tient »
2. **Idempotence** : `f(f(x)) === f(x)`
3. **Inverse** : `decode(encode(x)) === x`
4. **Commutativité** : `add(a, b) === add(b, a)`
5. **Cohérence avec un oracle** : la nouvelle implémentation donne le même résultat que l'ancienne (refactoring safe)
6. **Modèle métier** : « ramener un PNJ à 0 PV le rend mort »

#### 🧩 Exemple concret

```typescript
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { Inventory } from '../../src/domain/inventory';
import { makeItem } from '../helpers/factories';

describe('Inventory (propriétés)', () => {
  it('après n ajouts dans un inventaire vide (avec n ≤ 10), la taille est n', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }),
        (n) => {
          const inv = new Inventory([]);
          for (let i = 0; i < n; i++) inv.add(makeItem({ id: `item-${i}` }));
          return inv.size() === n;
        }
      )
    );
  });

  it('toute tentative d\'ajout au-dessus de 10 est refusée et n\'augmente pas la taille', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 100 }),
        (n) => {
          const inv = new Inventory(
            Array.from({ length: 10 }, (_, i) => makeItem({ id: `pre-${i}` }))
          );
          const sizeBefore = inv.size();
          const result = inv.add(makeItem({ id: `new-${n}` }));
          return result.success === false && inv.size() === sizeBefore;
        }
      )
    );
  });

  it('supprimer puis rajouter un item identique laisse la taille inchangée', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 5 }),
        (itemNames) => {
          const items = itemNames.map(name => makeItem({ id: name, name }));
          const inv = new Inventory(items);
          const sizeBefore = inv.size();
          const removed = inv.remove(items[0].id);
          inv.add(removed!);
          return inv.size() === sizeBefore;
        }
      )
    );
  });
});
```

Cette dernière propriété trouvera des bugs comme : « si l'item supprimé a un id qui se chevauche avec un autre, l'inventaire perd un objet », bug que les tests par l'exemple n'auraient pas détecté.

#### 🎯 Exercice rapide

**« Propriétés sur `applyPotion` »** — Écris 3 propriétés pour la fonction `applyPotion` :
1. Les PV après soin ne dépassent jamais `maxHp`
2. Les PV après soin sont toujours ≥ aux PV avant soin (la potion ne peut pas blesser)
3. Une potion de puissance 0 ne change pas les PV

Utilise `fc.integer({ min: 1, max: 200 })` pour les PV et `fc.integer({ min: 0, max: 100 })` pour la puissance.

#### ✅ Correction

```typescript
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { applyPotion } from '../../src/domain/items';
import { makeCharacter, makeItem } from '../helpers/factories';

describe('applyPotion (propriétés)', () => {
  it('les PV après soin ne dépassent jamais maxHp', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),  // hp initial
        fc.integer({ min: 1, max: 200 }),  // maxHp
        fc.integer({ min: 0, max: 1000 }), // potion power
        (hp, maxHp, power) => {
          fc.pre(hp <= maxHp); // pré-condition de validité
          const eleven = makeCharacter({ hp, maxHp });
          const potion = makeItem({ type: 'consumable', power });

          applyPotion(eleven, potion);

          return eleven.stats.hp <= maxHp;
        }
      )
    );
  });

  it('les PV après soin sont toujours >= aux PV avant', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 200 }),
        fc.integer({ min: 0, max: 100 }),
        (hp, maxHp, power) => {
          fc.pre(hp <= maxHp);
          const eleven = makeCharacter({ hp, maxHp });
          const potion = makeItem({ type: 'consumable', power });
          const hpBefore = eleven.stats.hp;

          applyPotion(eleven, potion);

          return eleven.stats.hp >= hpBefore;
        }
      )
    );
  });

  it('une potion de puissance 0 ne change pas les PV', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 200 }),
        (hp, maxHp) => {
          fc.pre(hp <= maxHp);
          const eleven = makeCharacter({ hp, maxHp });
          const potion = makeItem({ type: 'consumable', power: 0 });
          const hpBefore = eleven.stats.hp;

          applyPotion(eleven, potion);

          return eleven.stats.hp === hpBefore;
        }
      )
    );
  });
});
```

#### 🚀 Pistes d'exercices avancés

1. **Tester la sérialisation/désérialisation avec un roundtrip** — La fonction `SaveService` sérialise l'état du jeu en JSON. Écris une propriété : `parse(serialize(state)) === state` pour n'importe quel état généré aléatoirement. Utilise un arbitraire complexe : `fc.record({ player: fc.record({ name: fc.string(), hp: fc.nat() }), inventory: fc.array(...) })`. Vérifie aussi avec des chaînes contenant des caractères spéciaux, des emojis, des guillemets — c'est là que la sérialisation casse souvent.
2. **Model-based testing** — Implémente un modèle simplifié de l'`Inventory` (juste un compteur de taille) et utilise `fc.commands` pour générer des séquences d'opérations aléatoires (`add`, `remove`, `swap`). Vérifie que le vrai inventaire et le modèle restent en accord. Cette technique permet de détecter des bugs d'état très subtils.

---

### 5.2 — Stratégies de génération et shrinking

#### 📖 Détail

La puissance du PBT ne tient pas seulement à la quantité de cas générés, mais surtout à deux mécanismes : **la stratégie de génération** (quelles données sont produites, avec quelle distribution) et **le shrinking** (la réduction d'un contre-exemple à sa forme minimale).

**Stratégies de génération** : fast-check expose des arbitraires composables. Le bon dosage entre données « réalistes » et « extrêmes » est crucial.

```typescript
// Naïf : génère plein de valeurs, mais souvent peu utiles
fc.integer()
// Sortie : -1234, 56789, -98765, 0, ...

// Mieux : bornes raisonnables alignées sur le domaine
fc.integer({ min: 0, max: 9999 })

// Pour des cas frontière, biaiser explicitement
fc.oneof(
  fc.constant(0),
  fc.constant(1),
  fc.constant(-1),
  fc.constant(Number.MAX_SAFE_INTEGER),
  fc.integer({ min: 2, max: 1000 })
)
```

**Pré-conditions et filtrage** : parfois, on doit générer une donnée et filtrer celles qui ne correspondent pas au contexte. Deux approches :

1. **`fc.pre(condition)`** : élimine l'itération si la condition est fausse
2. **`.filter(predicate)`** : reconstruit l'arbitraire en filtrant

```typescript
// Pré-condition : hp <= maxHp est requis
fc.property(
  fc.integer(), fc.integer(),
  (hp, maxHp) => {
    fc.pre(hp >= 0 && hp <= maxHp);
    // ... test
  }
)

// Filter : reconstruit l'arbitraire
const validHpPair = fc.tuple(fc.integer({ min: 0 }), fc.integer({ min: 1 }))
  .filter(([hp, maxHp]) => hp <= maxHp);
```

`.filter` est préférable quand le ratio de rejet est élevé (>20%), `fc.pre` quand c'est rare.

**Arbitraires composés** : pour générer un personnage cohérent, on chaîne des arbitraires :

```typescript
const characterArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  stats: fc.record({
    maxHp: fc.integer({ min: 1, max: 200 }),
  }).chain(({ maxHp }) =>
    fc.record({
      hp: fc.integer({ min: 0, max: maxHp }),
      maxHp: fc.constant(maxHp),
      attack: fc.integer({ min: 1, max: 50 }),
      defense: fc.integer({ min: 0, max: 30 }),
      energy: fc.integer({ min: 0, max: 100 }),
      maxEnergy: fc.integer({ min: 1, max: 100 }),
    })
  ),
  inventory: fc.array(itemArbitrary, { maxLength: 10 }),
  abilities: fc.array(abilityArbitrary, { maxLength: 5 }),
  statusEffects: fc.array(statusEffectArbitrary, { maxLength: 3 }),
});
```

L'usage de `.chain` garantit la cohérence (hp ≤ maxHp).

**Le shrinking** : c'est la fonctionnalité magique du PBT. Quand un test échoue avec une entrée complexe, fast-check tente de réduire l'entrée pour trouver la plus petite qui reproduit l'échec. Exemple :

```
Counterexample found: [
  { hp: 87234, maxHp: 100000, ... },
  { hp: 12, maxHp: 50, ... },
  500
]
After shrinking: [
  { hp: 0, maxHp: 0, ... },
  { hp: 0, maxHp: 0, ... },
  0
]
```

Le bug était présent dans le cas complexe, mais aussi dans le cas trivial `hp=0, maxHp=0, value=0`. Le shrinking économise des heures de débogage.

Le shrinking fonctionne automatiquement avec les arbitraires built-in. Pour les arbitraires custom, il faut parfois définir manuellement `withShrink` ou utiliser des compositions qui préservent la capacité de shrink.

**Reproductibilité** : chaque échec de fast-check fournit un `seed`. En réutilisant ce seed, on rejoue exactement la même séquence aléatoire. C'est essentiel pour reproduire un bug détecté en CI :

```typescript
fc.assert(
  fc.property(/* ... */),
  { seed: 1759325847, path: "5:2:1", endOnFailure: true }
);
```

**Performance et nombre d'itérations** : par défaut, fast-check fait 100 itérations. On peut l'augmenter (`numRuns: 1000`) pour les CI nightlies, ou le réduire (`numRuns: 10`) pour le développement. Le bon dosage : 100 en dev, 1000 en CI pleine, 10000 en nightly.

**Anti-patterns** :

1. **Propriété trop laxiste** : `return damage >= 0` au lieu de `>= 1`. Le test passe mais ne valide rien d'utile.
2. **Propriété qui re-implémente le code testé** : « damage === attack + base - defense » répété dans le test → on teste qu'on a copié-collé correctement, pas la logique.
3. **Arbitraires trop restrictifs** : ne générer que des cas faciles, on rate les cas limites.
4. **Tests non-déterministes** : utiliser `Math.random()` dans le code testé sans le contrôler, le shrinking ne fonctionne plus.

#### 🧩 Exemple concret

```typescript
import * as fc from 'fast-check';
import { describe, it } from 'vitest';

// Arbitraire pour Character cohérent
const characterArb = fc.record({
  maxHp: fc.integer({ min: 1, max: 500 }),
  attack: fc.integer({ min: 0, max: 100 }),
}).chain(({ maxHp, attack }) =>
  fc.record({
    name: fc.string({ minLength: 1, maxLength: 20 }),
    hp: fc.integer({ min: 0, max: maxHp }),
    maxHp: fc.constant(maxHp),
    attack: fc.constant(attack),
    defense: fc.integer({ min: 0, max: 30 }),
  })
);

describe('Combat (propriétés avancées)', () => {
  it('après une attaque, les PV de l\'ennemi sont toujours dans [0, maxHp]', () => {
    fc.assert(
      fc.property(
        characterArb,
        characterArb,
        fc.integer({ min: 1, max: 50 }),
        (attackerData, defenderData, baseDamage) => {
          const attacker = makeCharacter(attackerData);
          const defender = makeEnemy({
            hp: defenderData.hp,
            maxHp: defenderData.maxHp,
            defense: defenderData.defense,
          });
          const ability = makeAbility({ baseDamage });

          executeAttack(attacker, defender, ability);

          return defender.hp >= 0 && defender.hp <= defender.maxHp;
        }
      ),
      { numRuns: 500 } // plus que par défaut pour cette propriété cruciale
    );
  });

  it('un personnage mort ne peut pas attaquer (idempotence)', () => {
    fc.assert(
      fc.property(
        characterArb,
        fc.integer({ min: 1, max: 50 }),
        (attackerData, baseDamage) => {
          const attacker = makeCharacter({ ...attackerData, hp: 0 });
          const defender = makeEnemy({ hp: 100, maxHp: 100 });
          const ability = makeAbility({ baseDamage });

          const result = executeAttack(attacker, defender, ability);

          return result.success === false && defender.hp === 100;
        }
      )
    );
  });
});
```

#### 🎯 Exercice rapide

**« Propriété de sérialisation »** — Écris une propriété qui vérifie : « pour tout `GameState` (avec player, inventory, scene, score), `JSON.parse(JSON.stringify(state))` donne un objet structurellement équivalent ». Utilise un arbitraire qui couvre les cas limites (string vides, chiffres à virgule, tableau vide).

#### ✅ Correction

```typescript
import * as fc from 'fast-check';
import { describe, it, expect } from 'vitest';

const gameStateArb = fc.record({
  player: fc.record({
    name: fc.string({ minLength: 0, maxLength: 30 }),
    hp: fc.integer({ min: 0, max: 9999 }),
    inventory: fc.array(
      fc.record({
        id: fc.string({ minLength: 1, maxLength: 10 }),
        name: fc.string({ minLength: 0, maxLength: 50 }),
      }),
      { maxLength: 20 }
    ),
  }),
  scene: fc.string({ minLength: 0, maxLength: 50 }),
  score: fc.integer({ min: 0, max: 999999 }),
});

describe('GameState sérialisation', () => {
  it('JSON.parse(JSON.stringify(state)) est structurellement équivalent au state original', () => {
    fc.assert(
      fc.property(gameStateArb, (state) => {
        const roundtrip = JSON.parse(JSON.stringify(state));
        expect(roundtrip).toEqual(state);
        return true;
      })
    );
  });
});
```

Note : `toEqual` accepte les différences de référence mais pas les différences structurelles. Si la propriété échoue, fast-check trouvera typiquement une chaîne contenant un caractère problématique (`\u0000`, par exemple) ou un nombre flottant qui perd de la précision.

#### 🚀 Pistes d'exercices avancés

1. **Arbitraire pour des actions de jeu** — Modélise une `GameAction` (attack, useItem, flee, save) en arbitraire fast-check. Génère des séquences aléatoires d'actions de longueur variable (5-50 actions) et vérifie l'invariant : « après n'importe quelle séquence d'actions, le state du jeu reste valide (HP dans bornes, inventaire ≤ 10, etc.) ». C'est de la model-based testing.
2. **Reproduire un bug avec seed** — Provoque volontairement un bug dans `calculateDamage` (par exemple, retourner 0 au lieu de 1 quand defense > attack). Lance fast-check, note le seed du contre-exemple, corrige le bug, puis vérifie qu'avec le même seed la propriété passe désormais. Documente ce workflow pour ton équipe.

---

# 🌆 APRÈS-MIDI

---

## Module 6 — BDD avancé avec Gherkin

### 6.1 — De la user story au scénario Gherkin

#### 📖 Détail

Une **user story** bien formée suit le pattern : « En tant que [rôle], je veux [action], afin de [bénéfice] ». Elle est concise (1-3 lignes) et exprime un besoin métier, pas une solution technique. Le passage d'une user story à des scénarios Gherkin exécutables est une compétence à part entière, qui se construit avec l'expérience.

**Étapes de transformation user story → scénarios Gherkin** :

1. **Identifier le comportement central** : qu'est-ce que l'utilisateur fait, et qu'est-ce qu'il observe en retour ?
2. **Lister les cas de succès** : le chemin nominal, les variantes mineures (différentes données d'entrée)
3. **Lister les cas d'échec** : qu'est-ce qui peut empêcher l'action ? Qu'est-ce qui se passe alors ?
4. **Lister les cas limites** : valeurs extrêmes, états bord
5. **Rédiger un scénario par cas** : un seul comportement par scénario
6. **Factoriser** : si plusieurs scénarios partagent un contexte initial, extraire un `Background`
7. **Paramétrer** : si plusieurs scénarios diffèrent uniquement par les données, utiliser `Scenario Outline` + `Examples`

**Exemple complet de transformation** :

**User story** :
> En tant que joueur de Hawkins Lab Escape, je veux pouvoir équiper une arme depuis mon inventaire, afin d'augmenter mes dégâts d'attaque.

**Analyse** :
- Comportement : équiper une arme (action), augmenter les dégâts (effet observable)
- Cas de succès : équiper une arme valide
- Cas d'échec : équiper un item qui n'est pas une arme, équiper alors qu'on est mort
- Cas limites : équiper alors qu'on a déjà une arme (substitution), équiper la même arme deux fois

**Scénarios résultants** :
```gherkin
Feature: Équiper une arme

  Background:
    Given Eleven est en vie avec 50 PV

  Scenario: Équipement d'une arme valide depuis l'inventaire
    Given son inventaire contient une "Slingshot" de puissance 5
    And elle n'a pas d'arme équipée
    When elle équipe la "Slingshot"
    Then son attaque augmente de 5
    And la "Slingshot" est marquée comme équipée

  Scenario: Refus d'équiper un item qui n'est pas une arme
    Given son inventaire contient une "Eggos Box" de type consommable
    When elle tente d'équiper la "Eggos Box"
    Then l'action est refusée pour "Item non équipable"
    And son attaque reste inchangée

  Scenario Outline: Substitution d'une arme déjà équipée
    Given elle a déjà équipé une "<arme_actuelle>" de puissance <puissance_actuelle>
    And son inventaire contient une "<nouvelle_arme>" de puissance <nouvelle_puissance>
    When elle équipe la "<nouvelle_arme>"
    Then son attaque varie de <variation>

    Examples:
      | arme_actuelle | puissance_actuelle | nouvelle_arme | nouvelle_puissance | variation |
      | Slingshot     | 5                  | Bat           | 12                 | +7        |
      | Bat           | 12                 | Walkie        | 1                  | -11       |
      | Lighter       | 3                  | Lighter       | 3                  | 0         |
```

**Anti-patterns courants** :

- **La user story déguisée en scénario** : « Scenario: En tant que joueur, je veux équiper... » → non, le `Feature:` couvre la user story, le `Scenario:` décrit un cas concret.
- **Le scénario UI-only** : « When je clique sur le bouton "Équiper" » → couplage UI, perd la portabilité métier.
- **Le scénario kilométrique** : 15 étapes Given/When/Then mélangées → diviser en sous-scénarios.
- **Le scénario sans Then** : « Scenario: équiper une arme. Given... When elle équipe... » et fin → où est l'assertion ?
- **Les noms de scénarios génériques** : « Scenario: cas 1 », « Scenario: erreur » → préférer des intitulés descriptifs.

**Convention de nommage** : les noms de scénarios doivent décrire le **résultat attendu**, pas l'action.
- ❌ « Scenario: Cliquer sur équiper »
- ✅ « Scenario: Équipement d'une arme valide depuis l'inventaire »
- ❌ « Scenario: Test 3 »
- ✅ « Scenario: Refus d'équiper un item qui n'est pas une arme »

**Granularité** : combien de scénarios par feature ? Règle empirique : 3 à 10. Moins, vous sous-spécifiez. Plus, vous mélangez probablement deux features (à diviser).

**La conversation des trois amigos** : la valeur du BDD ne tient pas au format Gherkin lui-même, mais à la **conversation préalable** entre product owner, développeur et testeur. Cette conversation révèle les ambiguïtés, les cas oubliés, les contradictions. Les scénarios sont la trace écrite de cette conversation, pas l'objectif premier. Une équipe qui rédige des scénarios sans converser produit des scénarios mécaniques et incomplets.

#### 🧩 Exemple concret

**User story** :
> En tant que joueur, je veux sauvegarder ma progression à n'importe quel moment hors-combat, afin de ne pas perdre mon avancement.

**Scénarios résultants** :
```gherkin
Feature: Sauvegarde manuelle de la progression

  Background:
    Given Eleven a 75 PV et se trouve dans la scène "lab"

  Scenario: Sauvegarde réussie en exploration
    Given le jeu n'est pas en combat
    When le joueur sauvegarde la partie
    Then la sauvegarde est créée avec l'état actuel
    And un message de confirmation est affiché

  Scenario: Sauvegarde après un combat gagné
    Given Eleven vient de gagner un combat contre un Demogorgon
    When le joueur sauvegarde la partie
    Then la sauvegarde est créée avec son XP mis à jour

  Scenario: Refus de sauvegarder en plein combat
    Given Eleven est en combat avec un Demogorgon
    When le joueur tente de sauvegarder la partie
    Then la sauvegarde est refusée pour "Sauvegarde interdite en combat"

  Scenario: Écrasement d'une sauvegarde existante
    Given une sauvegarde existante du jour précédent
    When le joueur sauvegarde la partie
    Then la sauvegarde précédente est remplacée par l'état actuel

  Scenario: Erreur de stockage
    Given le stockage local est plein
    When le joueur sauvegarde la partie
    Then la sauvegarde échoue avec le message "Espace de stockage insuffisant"
```

#### 🎯 Exercice rapide

**« Transformer une user story »** — Voici une user story. Produis 3 scénarios Gherkin :

> En tant que joueur, je veux fuir un combat trop difficile, afin de préserver mes points de vie.

#### ✅ Correction

```gherkin
Feature: Fuite d'un combat

  Background:
    Given Eleven est en combat avec un Demogorgon

  Scenario: Fuite réussie
    Given Eleven a une vitesse supérieure à celle du Demogorgon
    When le joueur déclenche l'action "Fuir"
    Then le combat se termine sans dégâts supplémentaires
    And Eleven retourne dans la scène précédente

  Scenario: Fuite échouée
    Given Eleven a une vitesse inférieure à celle du Demogorgon
    When le joueur déclenche l'action "Fuir"
    Then la fuite échoue avec le message "Le Demogorgon te rattrape"
    And le Demogorgon riposte avec une attaque

  Scenario: Fuite impossible contre un boss
    Given le combat est marqué comme "Combat de boss"
    When le joueur déclenche l'action "Fuir"
    Then la fuite est refusée pour "Impossible de fuir un combat de boss"
    And le combat continue
```

#### 🚀 Pistes d'exercices avancés

1. **Scenario Outline pour les fuites** — Refactorise les scénarios de fuite avec un `Scenario Outline` paramétrant les vitesses et résultats. Mesure l'impact en lisibilité : la table est-elle plus claire que 3 scénarios séparés ? À partir de quel nombre de cas le Outline devient-il préférable ?
2. **Conversation 3 amigos simulée** — Joue le rôle d'un PO sur une feature complexe (système de quêtes secondaires). Demande à un collègue de jouer le testeur, à un autre le développeur. Conduisez une session de rédaction de scénarios à 3 voix de 30 minutes. Note les insights collectifs que tu n'aurais pas eus seul : cas oubliés, ambiguïtés révélées, simplifications possibles.

---

### 6.2 — Cucumber.js avec TypeScript : mise en pratique avancée

#### 📖 Détail

Cette section passe du Gherkin théorique à la mise en place concrète d'**une suite BDD exécutable** sur Hawkins Lab Escape avec **@cucumber/cucumber** et **TypeScript**, en allant plus loin que la démo du J1. Nous abordons la configuration robuste, l'écriture des step definitions typées, l'organisation des fichiers, les pièges d'intégration TS/JS, les `Scenario Outline`, les hooks par tags, et l'exécution en CI.

**Structure de dossier recommandée** :

```
tests/bdd/
├── features/
│   ├── combat.feature
│   ├── inventory.feature
│   └── save.feature
├── steps/
│   ├── combat.steps.ts
│   ├── inventory.steps.ts
│   └── save.steps.ts
├── support/
│   ├── world.ts
│   ├── hooks.ts
│   └── parameter-types.ts
└── helpers/
    └── builders.ts
```

**Le World typé** : sans typage, le `this` partagé entre étapes est `any`, on perd l'autocomplétion et la sécurité.

```typescript
// tests/bdd/support/world.ts
import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { Game } from '../../../src/game';
import type { Character, Enemy } from '../../../src/domain/character';

export interface ActionResult {
  success: boolean;
  reason?: string;
}

export class HawkinsWorld extends World {
  game!: Game;
  player!: Character;
  enemy?: Enemy;
  lastResult?: ActionResult;

  constructor(options: IWorldOptions) {
    super(options);
  }

  resetGame() {
    this.game = new Game(/* deps */);
    this.lastResult = undefined;
  }
}

setWorldConstructor(HawkinsWorld);
```

**Step definitions typées** :

```typescript
// tests/bdd/steps/combat.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { HawkinsWorld } from '../support/world';
import { makeCharacter, makeEnemy, makeAbility } from '../helpers/builders';

Given('Eleven a {int} PV et {int} énergie psychique',
  function (this: HawkinsWorld, hp: number, energy: number) {
    this.player = makeCharacter({ name: 'Eleven', hp, energy, maxHp: 100, maxEnergy: 50 });
  });

Given('un Demogorgon a {int} PV', function (this: HawkinsWorld, hp: number) {
  this.enemy = makeEnemy({ name: 'Demogorgon', hp });
});

When('Eleven utilise {string} sur le Demogorgon',
  async function (this: HawkinsWorld, abilityName: string) {
    const ability = makeAbility({ name: abilityName, baseDamage: 30, energyCost: 15 });
    this.lastResult = await this.game.executeAttack(this.player, this.enemy!, ability);
  });

Then('le Demogorgon a {int} PV', function (this: HawkinsWorld, hp: number) {
  expect(this.enemy!.hp).to.equal(hp);
});
```

**Parameter types personnalisés** : pour des données complexes (ex. parser "Eleven" → un objet `Character`), on peut définir des types de paramètre custom :

```typescript
// tests/bdd/support/parameter-types.ts
import { defineParameterType } from '@cucumber/cucumber';
import { makeCharacter } from '../helpers/builders';

defineParameterType({
  name: 'character',
  regexp: /Eleven|Mike|Will|Dustin|Lucas/,
  transformer(name: string) {
    return makeCharacter({ name });
  },
});
```

Et dans le Gherkin : `Given {character} a 100 PV` se traduit par une étape qui reçoit directement un `Character` instancié.

**Hooks ciblés par tag** :

```typescript
// tests/bdd/support/hooks.ts
import { Before, After } from '@cucumber/cucumber';
import { HawkinsWorld } from './world';

Before(function (this: HawkinsWorld) {
  this.resetGame();
});

Before({ tags: '@combat' }, function (this: HawkinsWorld) {
  this.game.startCombatMode();
});

After(function (this: HawkinsWorld, scenario) {
  if (scenario.result?.status === 'FAILED') {
    console.log(`Scénario échoué : ${scenario.pickle.name}`);
    console.log(`État final : ${JSON.stringify(this.player)}`);
  }
});
```

**Scenario Outline avancé** :

```gherkin
Scenario Outline: Calcul de dégâts en fonction de l'attaque et défense
  Given Eleven a une attaque de <attaque>
  And un Demogorgon a une défense de <defense>
  When Eleven utilise une attaque de baseDamage <base>
  Then les dégâts infligés sont <degats>

  Examples:
    | attaque | defense | base | degats |
    | 10      | 5       | 8    | 13     |
    | 5       | 10      | 3    | 1      |
    | 20      | 20      | 10   | 10     |
    | 0       | 100     | 0    | 1      |
```

Un seul scénario, 4 cas testés. Pratique mais à doser : au-delà de 6-8 lignes d'examples, ça devient une table de vérité et la lisibilité Gherkin se perd au profit d'un test paramétré pur.

**Pièges d'intégration TS** :

- **Compilation ESM/CommonJS** : @cucumber/cucumber est par défaut CommonJS, alors que Vitest et les projets modernes utilisent ESM. Solution : utiliser `ts-node/esm` ou compiler en CJS pour les tests Cucumber.
- **Le `this` non-fléché** : les step definitions doivent utiliser `function () { ... }`, pas des arrow functions `() => { ... }`, sinon `this` ne pointe pas vers le World.
- **Imports relatifs** : vérifier que les `paths` dans `tsconfig.json` sont résolus correctement par ts-node.
- **Async/await** : toujours préférer `async function (...) { await this.game.foo(); }` aux callbacks, plus lisible et plus sûr.

**CI/CD** : intégration GitHub Actions :

```yaml
- name: Run BDD tests
  run: npx cucumber-js
- name: Upload report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: cucumber-report
    path: reports/cucumber.html
```

#### 🧩 Exemple concret — Setup complet pour la feature "inventory"

```gherkin
# tests/bdd/features/inventory.feature
@inventory
Feature: Gestion de l'inventaire

  Background:
    Given Eleven a un inventaire vide

  Scenario: Ramasser un objet
    When elle ramasse une "Eggos Box"
    Then son inventaire contient 1 objet
    And l'objet ramassé est "Eggos Box"

  Scenario Outline: Inventaire plein selon différents seuils
    Given son inventaire contient <items> objets
    When elle tente de ramasser une "Eggos Box"
    Then l'action est <résultat>

    Examples:
      | items | résultat                                |
      | 9     | acceptée                                |
      | 10    | refusée avec "Inventaire plein"         |
      | 11    | refusée avec "Inventaire plein"         |
```

```typescript
// tests/bdd/steps/inventory.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { HawkinsWorld } from '../support/world';
import { Inventory } from '../../../src/domain/inventory';
import { makeItem } from '../helpers/builders';

Given('Eleven a un inventaire vide', function (this: HawkinsWorld) {
  this.player.inventory = [];
});

Given('son inventaire contient {int} objets',
  function (this: HawkinsWorld, n: number) {
    this.player.inventory = Array.from({ length: n }, (_, i) =>
      makeItem({ id: `item-${i}` })
    );
  });

When('elle ramasse une {string}', function (this: HawkinsWorld, itemName: string) {
  const inv = new Inventory(this.player.inventory);
  this.lastResult = inv.add(makeItem({ name: itemName }));
  this.player.inventory = inv.items;
});

When('elle tente de ramasser une {string}', function (this: HawkinsWorld, itemName: string) {
  const inv = new Inventory(this.player.inventory);
  this.lastResult = inv.add(makeItem({ name: itemName }));
  this.player.inventory = inv.items;
});

Then('son inventaire contient {int} objet(s)', function (this: HawkinsWorld, n: number) {
  expect(this.player.inventory).to.have.lengthOf(n);
});

Then('l\'objet ramassé est {string}', function (this: HawkinsWorld, name: string) {
  expect(this.player.inventory.at(-1)?.name).to.equal(name);
});

Then('l\'action est acceptée', function (this: HawkinsWorld) {
  expect(this.lastResult?.success).to.be.true;
});

Then('l\'action est refusée avec {string}', function (this: HawkinsWorld, reason: string) {
  expect(this.lastResult?.success).to.be.false;
  expect(this.lastResult?.reason).to.equal(reason);
});
```

#### 🎯 Exercice rapide

**« Setup Cucumber + premier feature »** — Sur Hawkins Lab Escape, mets en place Cucumber avec le World typé, et fais passer la feature `inventory.feature` ci-dessus (Background + 1 scénario simple + 1 `Scenario Outline` à 3 exemples). Vise un `npx cucumber-js` qui affiche `4 scenarios passing` (le Outline compte chaque exemple comme un scénario).

#### ✅ Correction

Voir l'exemple ci-dessus. Critères de réussite :
1. `npx cucumber-js` ne plante pas
2. Les 4 scénarios (1 simple + 3 du Outline) passent au vert
3. Le World est typé, l'autocomplete fonctionne dans les step files
4. Un rapport HTML est généré dans `reports/cucumber.html`
5. Le tag `@inventory` fonctionne : `npx cucumber-js --tags "@inventory"` filtre correctement

#### 🚀 Pistes d'exercices avancés

1. **Parameter types pour les personnages** — Implémente le parameter type `{character}` qui parse "Eleven", "Mike", "Will", "Dustin" et retourne un `Character` pré-configuré avec ses stats par défaut. Réécris 3 scénarios pour bénéficier de cette simplification. Mesure le gain en lisibilité Gherkin.
2. **CI complète avec rapport HTML annoté** — Configure GitHub Actions pour lancer Cucumber sur chaque PR, uploader le rapport HTML, et commenter automatiquement la PR avec le nombre de scénarios passants/échoués. Bonus : faire échouer la CI si la couverture BDD baisse de plus de 5 % en valeur absolue.

---

## Module 7 — Tests E2E avec Playwright

### 7.1 — Setup Playwright pour Hawkins Lab Escape

#### 📖 Détail

Les **tests end-to-end (E2E)** valident un parcours utilisateur **complet** à travers toute la stack : du clic dans l'UI à l'écriture en base de données, en passant par les appels API. Pour Hawkins Lab Escape, qui est un jeu rendu dans le navigateur (DOM/HTML5 ou Canvas), Playwright est l'outil de choix : multi-navigateurs, multi-plateformes, syntaxe moderne TypeScript, debugging visuel intégré.

**Pourquoi Playwright plutôt que Cypress ?**

| Critère | Playwright | Cypress |
|---|---|---|
| Multi-navigateurs | Chromium, Firefox, WebKit | Chrome, Edge (Firefox limité) |
| Multi-onglets/fenêtres | Natif | Limité |
| iframes | Excellent | Limité |
| API mobile | Natif (émulation) | Limité |
| Parallélisation | Out-of-the-box | Avec Cypress Cloud (payant) |
| Auto-waits | Excellent | Excellent |
| Debugging | Trace viewer, video | DevTools live |
| Vitesse | Plus rapide en CI | Plus interactif en local |
| Maturité écosystème | Croissante | Stable |

Pour un projet greenfield ou un jeu nécessitant tests mobiles, **Playwright est généralement préférable**. Pour un projet legacy déjà sur Cypress, la migration n'est pas urgente.

**Installation** :

```bash
npm init playwright@latest
# Choix recommandés :
# - TypeScript
# - Tests dans ./tests/e2e
# - GitHub Actions oui
# - Install browsers oui
```

**Configuration de base** :

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Premier test E2E** :

```typescript
// tests/e2e/new-game.spec.ts
import { test, expect } from '@playwright/test';

test('démarrer une nouvelle partie depuis le menu principal', async ({ page }) => {
  // Arrange
  await page.goto('/');

  // Act
  await page.getByRole('button', { name: 'Nouvelle Partie' }).click();
  await page.getByLabel('Nom du personnage').fill('Eleven');
  await page.getByRole('button', { name: 'Commencer' }).click();

  // Assert
  await expect(page.getByText('Bienvenue à Hawkins')).toBeVisible();
  await expect(page.getByTestId('player-hp')).toHaveText('100 / 100');
});
```

**Stratégies de sélecteurs** (par ordre de préférence) :
1. **`getByRole`** : sémantique, accessible, résistant aux changements de CSS
2. **`getByText`** : visible, lisible, mais sensible aux refactorings i18n
3. **`getByLabel`** : pour les inputs, lié au label visible
4. **`getByTestId`** : `data-testid` dédié, robuste mais « polluant » du DOM
5. **CSS/XPath** : dernier recours, fragiles

**Auto-waits Playwright** : pas besoin de `waitForSelector` la plupart du temps. Les méthodes comme `click()`, `fill()`, `toBeVisible()` attendent automatiquement la disponibilité de l'élément. Pour des cas spécifiques (animations, polling) : `page.waitForLoadState('networkidle')`, `page.waitForResponse(...)`.

**Tests spécifiques aux jeux Canvas** : si Hawkins Lab Escape rend en Canvas (par exemple avec Phaser, PixiJS, ou Three.js), Playwright ne peut pas inspecter le contenu du canvas directement. Solutions :
- Exposer des **hooks de test** dans le code de production (`window.__GAME__.getPlayerHp()`) qui ne sont actifs qu'en mode test
- Faire des **captures d'écran** comparées (visual regression)
- Tester via les **événements DOM périphériques** (menus, HUD non-canvas)

```typescript
// Hook de test exposé en mode test uniquement
if (process.env.NODE_ENV === 'test') {
  (window as any).__HAWKINS__ = {
    getPlayerHp: () => game.player.stats.hp,
    forceEnemySpawn: (enemyType: string) => game.spawn(enemyType),
    setSeed: (seed: number) => game.rng.setSeed(seed),
  };
}

// Test E2E qui utilise le hook
test('le joueur perd des PV lors d\'une attaque ennemie', async ({ page }) => {
  await page.goto('/?test=true');
  await page.evaluate(() => (window as any).__HAWKINS__.forceEnemySpawn('Demogorgon'));
  await page.getByRole('button', { name: 'Attendre' }).click(); // tour ennemi

  const hp = await page.evaluate(() => (window as any).__HAWKINS__.getPlayerHp());
  expect(hp).toBeLessThan(100);
});
```

**Tests cross-browser** : Playwright lance les 4 projets configurés (Chromium, Firefox, WebKit, Mobile). Une commande : `npx playwright test`. Bénéfice énorme : détecter les bugs spécifiques à Safari ou aux mobiles avant le client.

**Trace Viewer** : `npx playwright show-trace trace.zip` ouvre un débogueur visuel avec timeline, DOM snapshots, console, network. Outil quasi-magique pour comprendre un test qui échoue.

**CI/CD** : la config Playwright inclut un workflow GitHub Actions par défaut. Les rapports HTML et les traces sont automatiquement uploadés en artefact en cas d'échec.

#### 🧩 Exemple concret — Test complet du flow "nouvelle partie + combat"

```typescript
// tests/e2e/full-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Parcours complet : nouvelle partie → premier combat', () => {
  test('le joueur peut démarrer une partie et gagner son premier combat', async ({ page }) => {
    // Étape 1 : Nouvelle partie
    await page.goto('/');
    await page.getByRole('button', { name: 'Nouvelle Partie' }).click();
    await page.getByLabel('Nom du personnage').fill('Eleven');
    await page.getByRole('button', { name: 'Commencer' }).click();

    await expect(page.getByText('Bienvenue à Hawkins')).toBeVisible();

    // Étape 2 : Explorer jusqu'à un combat
    await page.getByTestId('move-north').click();
    await page.getByTestId('move-north').click();
    await expect(page.getByText('Un Demogorgon apparaît !')).toBeVisible();

    // Étape 3 : Combat
    await expect(page.getByTestId('combat-screen')).toBeVisible();
    await page.getByRole('button', { name: 'Psychic Blast' }).click();
    await expect(page.getByTestId('enemy-hp')).toHaveText('20 / 50');

    await page.getByRole('button', { name: 'Psychic Blast' }).click();
    await expect(page.getByText('Victoire !')).toBeVisible();

    // Étape 4 : Récompense
    await expect(page.getByText('+50 XP')).toBeVisible();
    await page.getByRole('button', { name: 'Continuer' }).click();
    await expect(page.getByTestId('player-xp')).toHaveText('50');
  });
});
```

#### 🎯 Exercice rapide

**« Setup Playwright + premier test »** — Mets en place Playwright sur Hawkins Lab Escape, configure une cible localhost:5173 (ou ton port), et écris un test qui :
1. Charge la page d'accueil
2. Vérifie que le titre "Hawkins Lab Escape" est visible
3. Clique sur "Nouvelle Partie"
4. Vérifie que le formulaire de création de personnage apparaît

#### ✅ Correction

```typescript
// tests/e2e/home.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Page d\'accueil', () => {
  test('affiche le titre du jeu et permet d\'accéder au formulaire de nouvelle partie', async ({ page }) => {
    // Arrange
    await page.goto('/');

    // Assert (initial)
    await expect(page.getByRole('heading', { name: 'Hawkins Lab Escape' })).toBeVisible();

    // Act
    await page.getByRole('button', { name: 'Nouvelle Partie' }).click();

    // Assert (after action)
    await expect(page.getByRole('heading', { name: 'Créer ton personnage' })).toBeVisible();
    await expect(page.getByLabel('Nom du personnage')).toBeVisible();
  });
});
```

#### 🚀 Pistes d'exercices avancés

1. **Test cross-browser avec assertions différenciées** — Écris un test qui se lance sur Chromium, Firefox et WebKit, mais qui adapte une assertion (par exemple : certaines polices s'affichent légèrement différemment, donc le pixel-match doit être tolérant sur WebKit). Utilise `test.skip(browserName === 'webkit', '...')` ou des `expect.poll` adaptés.
2. **Visual regression** — Configure `@playwright/test` avec `toHaveScreenshot()` pour comparer des captures d'écran de l'écran de combat sur 3 navigateurs. Documente le workflow : génération initiale, mise à jour quand le design change volontairement, gestion des faux positifs (mask les éléments dynamiques comme l'heure).

---

### 7.2 — Page Object Model et fiabilisation des tests

#### 📖 Détail

Au-delà de 10 tests E2E, un projet sans **Page Object Model (POM)** devient ingérable : les sélecteurs sont dupliqués, les workflows répétés, un changement d'UI casse 20 tests. Le POM est le pattern qui structure les tests E2E en **encapsulant les pages dans des classes** dont les méthodes représentent les actions utilisateur. À cela s'ajoute la **fiabilisation** : un test E2E qui passe 95 % du temps est inutile.

**Principe du POM** :

```typescript
// Sans POM : duplication massive
test('test 1', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Nouvelle Partie' }).click();
  await page.getByLabel('Nom du personnage').fill('Eleven');
  await page.getByRole('button', { name: 'Commencer' }).click();
});

test('test 2', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Nouvelle Partie' }).click();
  await page.getByLabel('Nom du personnage').fill('Mike');
  await page.getByRole('button', { name: 'Commencer' }).click();
});

// Avec POM : intention métier claire
test('test 1', async ({ page }) => {
  const home = new HomePage(page);
  await home.goto();
  await home.startNewGame('Eleven');
});

test('test 2', async ({ page }) => {
  const home = new HomePage(page);
  await home.goto();
  await home.startNewGame('Mike');
});
```

**Structure d'une Page Object** :

```typescript
// tests/e2e/pages/home.page.ts
import { Page, Locator, expect } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly newGameButton: Locator;
  readonly continueButton: Locator;
  readonly title: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByRole('heading', { name: 'Hawkins Lab Escape' });
    this.newGameButton = page.getByRole('button', { name: 'Nouvelle Partie' });
    this.continueButton = page.getByRole('button', { name: 'Continuer' });
  }

  async goto() {
    await this.page.goto('/');
    await expect(this.title).toBeVisible();
  }

  async startNewGame(characterName: string) {
    await this.newGameButton.click();
    await this.page.getByLabel('Nom du personnage').fill(characterName);
    await this.page.getByRole('button', { name: 'Commencer' }).click();
  }

  async continueLastSave() {
    await this.continueButton.click();
  }
}
```

**Hiérarchie de POM pour un jeu** :
- **Pages** : `HomePage`, `CharacterCreationPage`, `OverworldPage`, `CombatPage`, `InventoryPage`
- **Components** (sous-éléments réutilisables) : `HUDComponent` (barre HP/XP), `DialogueModalComponent`
- **Flows** (parcours complets composés) : `StartNewGameFlow.execute(name)`, `WinFirstCombatFlow.execute()`

```typescript
// tests/e2e/pages/combat.page.ts
import { Page, Locator, expect } from '@playwright/test';

export class CombatPage {
  readonly page: Page;
  readonly playerHp: Locator;
  readonly enemyHp: Locator;
  readonly victoryMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.playerHp = page.getByTestId('player-hp');
    this.enemyHp = page.getByTestId('enemy-hp');
    this.victoryMessage = page.getByText('Victoire !');
  }

  async useAbility(abilityName: string) {
    await this.page.getByRole('button', { name: abilityName }).click();
    // Wait for animation to settle
    await this.page.waitForTimeout(300);
  }

  async flee() {
    await this.page.getByRole('button', { name: 'Fuir' }).click();
  }

  async getEnemyHp(): Promise<number> {
    const text = await this.enemyHp.textContent();
    return parseInt(text?.split('/')[0].trim() ?? '0', 10);
  }

  async waitForVictory() {
    await expect(this.victoryMessage).toBeVisible({ timeout: 5000 });
  }
}
```

**Fiabilisation des tests E2E (flakiness)** : les sources de flakiness :
- **Timing** : animations, transitions CSS, timers, polling
- **Données réseau** : appels API non-déterministes
- **Ordre asynchrone** : événements DOM qui changent d'ordre
- **État global** : localStorage, cookies, base de données partagée
- **Ressources** : CPU/réseau lents en CI

Solutions :
- **Auto-waits Playwright** (`expect(...).toBeVisible()`) : attendent jusqu'au timeout configuré
- **MSW dans le browser** : remplacer les appels API par des handlers déterministes (cf. module 4)
- **Reset entre tests** : `await page.context().clearCookies()`, `await page.evaluate(() => localStorage.clear())`
- **Retry policy** : `retries: 2` en CI, mais à utiliser comme filet de sécurité, pas comme excuse
- **Trace Viewer** : pour comprendre les échecs intermittents

**Mocker les API en E2E** : pour tester l'UI sans dépendre d'un backend instable :

```typescript
test('affiche le leaderboard depuis l\'API', async ({ page }) => {
  await page.route('**/api/leaderboard', async route => {
    await route.fulfill({
      json: [
        { name: 'Eleven', score: 9999 },
        { name: 'Mike', score: 8500 },
      ],
    });
  });

  await page.goto('/leaderboard');
  await expect(page.getByText('Eleven')).toBeVisible();
});
```

Ça contredit l'idée de E2E « stack complète », mais c'est un compromis souvent justifié : on isole le test UI de l'instabilité backend.

**Anti-patterns du POM** :
- **Page Object trop intelligent** : une méthode `attackUntilVictory()` qui boucle elle-même rend le test obscur. Préférer exposer des actions atomiques.
- **Assertions dans le POM** : pas systématiquement interdit (`waitForVictory` est ok), mais éviter `expectScoreToBe(50)` dans le POM — l'assertion appartient au test.
- **POM qui dépend d'un autre POM** : risque de couplage. Préférer composer dans le test.

**Test E2E avec attentes explicites (anti-flakiness)** :

```typescript
// ❌ Test flaky avec waitForTimeout arbitraire
test('save game (flaky)', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Nouvelle Partie")');
  await page.fill('input[name="character-name"]', 'Eleven');
  await page.click('button:has-text("Commencer")');
  await page.waitForTimeout(2000); // arbitraire et lent
  await page.click('button:has-text("Sauvegarder")');
});

// ✅ Test fiabilisé avec attentes explicites
test('sauvegarder une partie crée un slot de sauvegarde visible', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Nouvelle Partie' }).click();
  await page.getByLabel('Nom du personnage').fill('Eleven');
  await page.getByRole('button', { name: 'Commencer' }).click();

  // Attendre que l'overworld soit chargé
  await expect(page.getByText('Bienvenue à Hawkins')).toBeVisible();

  await page.getByRole('button', { name: 'Sauvegarder' }).click();

  // Attendre la confirmation explicite
  await expect(page.getByText('Sauvegarde réussie')).toBeVisible();
  await expect(page.getByTestId('save-slot')).toHaveCount(1);
});
```

#### 🧩 Exemple concret — Test avec POM + MSW

```typescript
// tests/e2e/leaderboard.spec.ts
import { test, expect } from '@playwright/test';
import { HomePage } from './pages/home.page';
import { LeaderboardPage } from './pages/leaderboard.page';

test('affiche les meilleurs scores depuis l\'API', async ({ page }) => {
  // Arrange : mocker l'API
  await page.route('**/api/leaderboard', async route => {
    await route.fulfill({
      json: [
        { name: 'Eleven', score: 9999, level: 50 },
        { name: 'Mike', score: 8500, level: 42 },
        { name: 'Will', score: 7200, level: 38 },
      ],
    });
  });

  const home = new HomePage(page);
  const leaderboard = new LeaderboardPage(page);

  await home.goto();
  await leaderboard.open();

  // Assert : les 3 entrées sont visibles dans l'ordre
  await expect(leaderboard.getRow(0)).toContainText('Eleven');
  await expect(leaderboard.getRow(0)).toContainText('9999');
  await expect(leaderboard.getRow(1)).toContainText('Mike');
  await expect(leaderboard.getRow(2)).toContainText('Will');
});

test('affiche un message d\'erreur quand le leaderboard est indisponible', async ({ page }) => {
  await page.route('**/api/leaderboard', async route => {
    await route.fulfill({ status: 503 });
  });

  const home = new HomePage(page);
  const leaderboard = new LeaderboardPage(page);

  await home.goto();
  await leaderboard.open();

  await expect(page.getByText('Leaderboard temporairement indisponible')).toBeVisible();
});
```

#### 🎯 Exercice rapide

**« Créer la Page Object du combat »** — Implémente une classe `CombatPage` avec les méthodes : `useAbility(name)`, `getPlayerHp()`, `getEnemyHp()`, `waitForVictory()`, `waitForDefeat()`. Réécris ensuite le test de combat du 7.1 en utilisant cette Page Object.

#### ✅ Correction

```typescript
// tests/e2e/pages/combat.page.ts
import { Page, Locator, expect } from '@playwright/test';

export class CombatPage {
  readonly page: Page;
  readonly screen: Locator;
  readonly playerHp: Locator;
  readonly enemyHp: Locator;

  constructor(page: Page) {
    this.page = page;
    this.screen = page.getByTestId('combat-screen');
    this.playerHp = page.getByTestId('player-hp');
    this.enemyHp = page.getByTestId('enemy-hp');
  }

  async useAbility(name: string) {
    await this.page.getByRole('button', { name }).click();
    await this.page.waitForTimeout(300); // animation
  }

  async getPlayerHp(): Promise<number> {
    const text = await this.playerHp.textContent();
    return parseInt(text?.split('/')[0].trim() ?? '0', 10);
  }

  async getEnemyHp(): Promise<number> {
    const text = await this.enemyHp.textContent();
    return parseInt(text?.split('/')[0].trim() ?? '0', 10);
  }

  async waitForVictory() {
    await expect(this.page.getByText('Victoire !')).toBeVisible({ timeout: 5000 });
  }

  async waitForDefeat() {
    await expect(this.page.getByText('Défaite')).toBeVisible({ timeout: 5000 });
  }
}

// Test refactorisé
import { HomePage } from './pages/home.page';
import { OverworldPage } from './pages/overworld.page';

test('Eleven gagne son premier combat', async ({ page }) => {
  const home = new HomePage(page);
  const overworld = new OverworldPage(page);
  const combat = new CombatPage(page);

  await home.goto();
  await home.startNewGame('Eleven');
  await overworld.moveTo('north');
  await overworld.moveTo('north');
  await overworld.waitForCombat();

  expect(await combat.getEnemyHp()).toBe(50);
  await combat.useAbility('Psychic Blast');
  expect(await combat.getEnemyHp()).toBe(20);
  await combat.useAbility('Psychic Blast');
  await combat.waitForVictory();
});
```

#### 🚀 Pistes d'exercices avancés

1. **Component Object pour le HUD** — Refactore les sélecteurs `player-hp`, `player-xp`, `player-energy` en une classe `HUDComponent` réutilisée par plusieurs pages (Overworld, Combat, Inventory). Évalue : la duplication baisse-t-elle ? Les tests sont-ils plus stables ?
2. **Hiérarchie de Flows** — Crée des classes `StartNewGameFlow`, `WinFirstCombatFlow`, `OpenInventoryAndUsePotionFlow` qui orchestrent plusieurs Page Objects. Réécris 5 tests pour utiliser ces flows. Inconvénient à surveiller : le test devient-il une boîte noire ? Trouve l'équilibre entre abstraction et lisibilité.

---

## Module 8 — Métriques de qualité et stratégie cohérente

### 8.1 — Couverture de code et mutation testing

#### 📖 Détail

Mesurer la qualité d'une suite de tests est un problème ouvert. Deux familles de métriques dominent : la **couverture de code** (quelle proportion du code est exécutée par les tests ?) et le **mutation testing** (quelle proportion des défauts introduits volontairement est détectée par les tests ?). Comprendre leurs forces et faiblesses respectives évite les illusions de qualité.

**La couverture de code (code coverage)** est l'indicateur le plus connu. Il existe plusieurs niveaux :

- **Statements** : pourcentage d'instructions exécutées
- **Branches** : pourcentage de branches de conditionnelles couvertes (if/else, switch)
- **Functions** : pourcentage de fonctions appelées
- **Lines** : pourcentage de lignes touchées

Vitest expose la couverture via `v8` ou `istanbul` :

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.types.ts'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

Commande : `npm run test -- --coverage`.

**Les limites de la couverture** sont importantes à comprendre :

1. **Une ligne couverte n'est pas une ligne testée**. Si un test exécute une fonction sans assertion, la ligne est couverte mais le bug passe.
2. **100 % de couverture ne garantit rien**. On peut couvrir 100 % du code avec des tests qui ne valident aucun comportement.
3. **La couverture des branches est plus utile** que celle des lignes, mais reste insuffisante.
4. **Certains chemins sont impossibles à couvrir** (gardes défensives, erreurs internes du runtime) — ne pas s'obstiner.

La couverture est donc un **plancher** (« si je n'ai pas couvert ce code, je n'ai certainement pas de tests dessus »), pas un plafond. Atteindre 80 % est un bon objectif ; viser 100 % génère souvent du stress contre-productif.

**Le mutation testing** apporte la réponse à la question critique : « mes tests détectent-ils vraiment les bugs ? » Le principe : l'outil (Stryker) introduit des **mutations** automatiques dans le code (changer `<` en `<=`, supprimer une condition, remplacer `+` par `-`), lance la suite de tests, et vérifie qu'**au moins un test casse**. Si oui, la mutation est « tuée ». Si non, la mutation a « survécu » — ce qui signifie que ton test n'aurait pas détecté ce bug.

Score de mutation = (mutations tuées) / (mutations totales). Un score > 70 % indique une suite robuste.

**Installation Stryker** :

```bash
npm install --save-dev @stryker-mutator/core @stryker-mutator/vitest-runner
npx stryker init
```

```javascript
// stryker.config.cjs
module.exports = {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'vitest',
  coverageAnalysis: 'perTest',
  mutate: ['src/**/*.ts', '!src/**/*.test.ts'],
  thresholds: { high: 80, low: 60, break: 50 },
};
```

Lancement : `npx stryker run`.

**Mutations couramment testées par Stryker** :
- Opérateurs arithmétiques : `+`/`-`/`*`/`/`
- Opérateurs de comparaison : `<`/`>`/`<=`/`>=`/`==`/`===`
- Opérateurs logiques : `&&`/`||`
- Valeurs littérales : `0`/`1`/`true`/`false`
- Suppression de conditions : `if (x) {...}` → `if (true) {...}`
- Décrémentation : `i++` → `i--`

**Exemple** : la fonction `calculateDamage` avec `Math.max(1, base - defense)`. Si tu mutes en `Math.max(0, base - defense)`, les tests qui vérifient « les dégâts sont toujours ≥ 1 » casseront. Bonne suite. Si aucun test ne casse, c'est que tu ne testes pas ce minimum.

**Le mutation testing en pratique** :

- **Lent** : 30 secondes pour 10 mutations, 30 minutes pour 1000. À lancer en nightly, pas à chaque commit.
- **Cible** : viser un score de mutation > 70 % sur le **code métier critique**. Pour le code accessoire (UI, glue code), 50 % suffit.
- **Bug révélateur** : une mutation qui survit pointe presque toujours un test manquant ou un test trop permissif.
- **Combiné au PBT** : le PBT augmente significativement le score de mutation, car il génère des cas qui détectent les mutations subtiles.

**Anti-patterns** :

1. **Lancer Stryker à chaque commit** : trop lent, ralentit le dev.
2. **Viser 100 % de mutation score** : certaines mutations sont équivalentes (deux versions du code qui donnent le même résultat). Ce sont des faux positifs.
3. **Ignorer les mutations qui survivent sans investigation** : si on les masque sans comprendre, on rate le bug que l'outil voulait signaler.

#### 🧩 Exemple concret — Audit d'une fonction

Fonction testée :
```typescript
export function calculateDamage(attacker: Character, defender: Enemy, ability: Ability): number {
  const base = ability.baseDamage + attacker.stats.attack;
  const afterDefense = base - defender.defense;
  return Math.max(1, afterDefense);
}
```

Suite de tests :
```typescript
it('inflige attaque + base - défense', () => {
  expect(calculateDamage(makeCharacter({ attack: 10 }), makeEnemy({ defense: 3 }), makeAbility({ baseDamage: 8 })))
    .toBe(15);
});

it('inflige au moins 1 même si la défense excède', () => {
  expect(calculateDamage(makeCharacter({ attack: 1 }), makeEnemy({ defense: 100 }), makeAbility({ baseDamage: 1 })))
    .toBe(1);
});
```

**Couverture** : 100 % (toutes les lignes sont exécutées).

**Mutations testées par Stryker** :
1. `base - defense` → `base + defense` : test 1 échoue (10 + 8 + 3 = 21 ≠ 15). ✅ Tuée.
2. `Math.max(1, ...)` → `Math.max(0, ...)` : test 2 échoue ? Non, car 1 - 100 + 1 = -98, Math.max(0, -98) = 0 ≠ 1. ✅ Tuée.
3. `Math.max(1, ...)` → `Math.min(1, ...)` : test 1 attend 15, Math.min(1, 15) = 1 ≠ 15. ✅ Tuée.
4. `return Math.max(1, afterDefense)` → `return afterDefense` : test 2 attend 1, retourne -98 ≠ 1. ✅ Tuée.

Score de mutation : 4/4 = 100 %. Excellente couverture par les tests.

Si on retire le test 2 :
- Mutation 2 (Math.max 1→0) : test 1 attend 15, max(0, 15) = 15. ✅ Tuée (pas vraiment, c'est équivalent).
- Mutation 4 (return max → return raw) : test 1 attend 15, retourne 15 directement. ⚠️ Survivante !

Stryker dit : « avec ce seul test, ta fonction pourrait perdre `Math.max(1, ...)` sans que personne s'en rende compte ». Il pointe ainsi le test manquant.

#### 🎯 Exercice rapide

**« Lancer Stryker sur Hawkins Lab Escape »** — Installe Stryker dans le projet, configure-le pour Vitest, et lance-le sur ta suite existante. Analyse les résultats :
1. Quel est le score de mutation global ?
2. Identifie 3 mutations « survivantes » (non détectées)
3. Pour chacune, écris un test qui la tue

#### ✅ Correction

Pas de correction fixe (résultat dépend du projet). Critères de réussite :

1. Stryker installé et configuré (`npx stryker run` produit un rapport HTML)
2. Score de mutation > 60 % (raisonnable pour un projet en cours)
3. Identification de 3 survivantes documentée (fichier, ligne, mutation appliquée)
4. 3 nouveaux tests committés qui tuent ces mutations
5. Re-run Stryker confirme l'amélioration du score

Exemple de survivante typique sur Hawkins Lab Escape :
- Mutation : `if (potion.power) {...}` → `if (true) {...}` (suppression de condition)
- Test manquant : « `applyPotion` avec `power: undefined` ne crash pas et ne change pas les PV »
- Test ajouté : couvre explicitement le cas `power: undefined`

#### 🚀 Pistes d'exercices avancés

1. **Intégration CI Stryker nightly** — Configure une GitHub Action qui lance Stryker chaque nuit, génère le rapport HTML, et fait échouer la build si le score baisse de plus de 5 points. Documente comment l'équipe traite les régressions de mutation score.
2. **Mutation testing ciblé** — Stryker peut cibler un sous-ensemble du code (`mutate: ['src/domain/**/*.ts']`). Définis une politique : 90 % de mutation score sur le domaine métier, 60 % sur les services, ignoré sur l'UI. Justifie cette gradation et propose-la à ton équipe.

---

### 8.2 — Stratégie de tests cohérente : la pyramide en action

#### 📖 Détail

Avoir des tests à tous les niveaux (unitaires, intégration, BDD, E2E, propriété, mutation), c'est bien. **Les orchestrer en une stratégie cohérente**, c'est la compétence qui distingue un projet professionnel d'un projet bricolé. Cette section met en cohérence tout ce qu'on a vu et propose un cadre opérationnel.

**La pyramide de tests** (Mike Cohn, 2009) reste le modèle de référence pour structurer une stratégie de tests équilibrée :

- **70-80 % de tests unitaires** : rapides (ms), nombreux (milliers), couvrent la logique métier
- **15-25 % de tests d'intégration** (incluant BDD) : modérés (10-100 ms), couvrent la collaboration
- **5-10 % de tests E2E** : lents (secondes), couvrent les parcours utilisateur critiques

Pour Hawkins Lab Escape, sur 200 tests, on viserait : **150 unitaires, 35 d'intégration (dont BDD), 15 E2E**.

**Pourquoi cette forme pyramidale ?** Quatre raisons s'additionnent :

1. **Ratio coût/valeur** : un test unitaire coûte quelques minutes à écrire et quelques ms à exécuter ; un test E2E coûte 30 minutes à écrire et 30 secondes à exécuter.
2. **Précision du diagnostic** : un test unitaire qui échoue pointe la fonction en faute. Un test E2E qui échoue dit juste qu'un bug existe quelque part.
3. **Stabilité** : plus on monte, plus on multiplie les dépendances (réseau, DB, UI, timing) et donc les sources de flakiness.
4. **Rapidité de feedback** : un développeur en TDD veut un feedback en < 1 seconde. Les unitaires permettent ça.

**Les anti-pyramides à éviter** :

- **Le cône de glace inversé** : peu d'unitaires, beaucoup d'E2E manuels. Symptôme d'équipe sans culture de test automatisé.
- **Le sablier** : beaucoup d'unitaires, peu d'intégration, beaucoup d'E2E. Symptôme d'un projet qui a sauté l'étape intermédiaire — les bugs d'intégration ne sont détectés ni en bas ni en haut.
- **Le rectangle** : autant de tests à chaque niveau. Symptôme d'absence de réflexion stratégique.

**Arbre de décision : où placer un test ?**

1. Règle métier pure sans dépendance externe → **Unitaire**
2. Collaboration de plusieurs modules avec des fakes → **Intégration**
3. Parcours utilisateur observable depuis l'UI → **E2E**
4. Comportement métier exprimable en langage naturel → **BDD** (en intégration le plus souvent)
5. Régression visuelle → **Visual regression** (Playwright `toHaveScreenshot`)
6. Invariant universel (« toujours X quel que soit Y ») → **Property-based** (fast-check)

**Application à Hawkins Lab Escape** :
- `calculateDamage` (pure) → unitaire
- `Inventory.add` (logique avec état) → unitaire
- `CombatService` orchestrant 3 services → intégration
- `SaveService` + `InMemoryStorage` → intégration
- `LeaderboardService` + MSW → intégration
- « En tant que joueur, je veux sauvegarder » → BDD
- « Nouvelle partie → combat → victoire » → E2E
- « Toutes les attaques produisent un nombre de dégâts ≥ 1 » → property-based
- « L'écran de combat reste visuellement identique » → visual regression

**Stratification CI/CD** : les tests ne doivent pas tous tourner partout. Voici une stratification typique :

| Étape | Tests exécutés | Durée cible | Bloquant |
|---|---|---|---|
| Pre-commit hook (local) | Unitaires modifiés + lint | < 5 s | Oui |
| Push → CI sur la branche | Unitaires complets + intégration + BDD | < 2 min | Oui |
| Pull Request | + E2E Chromium + couverture | < 5 min | Oui |
| Merge sur `main` | + E2E Firefox + WebKit + visual regression | < 10 min | Oui |
| Nightly | + Mutation testing complet + property-based exhaustif | < 30 min | Non |
| Pre-release | + Tests de performance + tests d'accessibilité | < 1 h | Oui (sur release branch) |

Cette gradation respecte le principe : **plus c'est lent, plus c'est tard**. Le développeur a un feedback rapide quand il code, la confiance s'accumule par couches successives avant la livraison.

**Configuration pratique pour Hawkins Lab Escape** :

```json
// package.json (extrait des scripts)
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:unit": "vitest run --dir tests/unit",
    "test:integration": "vitest run --dir tests/integration",
    "test:bdd": "cucumber-js",
    "test:e2e": "playwright test --project=chromium",
    "test:e2e:all": "playwright test",
    "test:visual": "playwright test --grep @visual",
    "test:mutation": "stryker run",
    "test:property": "vitest run tests/property",
    "test:all": "npm run test && npm run test:bdd && npm run test:e2e"
  }
}
```

**Indicateurs de santé** à surveiller régulièrement :
- **Temps total d'exécution** : doit rester stable ou décroître
- **Taux de flakiness** : pourcentage de tests qui échouent puis passent sans changement de code. Cible : < 1 %
- **Couverture de code** : 80 % minimum sur la logique métier
- **Score de mutation** : 70 % minimum avec Stryker
- **Ratio de la pyramide** : pourcentage par niveau

**Quand supprimer un test ?** Question taboue mais essentielle. Un test mérite la suppression si :
- Il teste un comportement qui n'est plus une exigence métier
- Il duplique un autre test (couverture identique)
- Il est devenu flaky de manière irrécupérable
- Il teste l'implémentation et bloque un refactoring légitime

Supprimer un test n'est pas un échec, c'est une décision stratégique. Ce qui est néfaste, c'est d'avoir des tests qui restent dans la suite mais qu'on ignore (skip permanent) ou qu'on retry à l'infini pour masquer leur instabilité.

#### 🧩 Exemple concret — Cartographie de la feature "Combat"

Pour une seule feature (Combat), voici comment on répartit intelligemment les tests :

```
COMBAT (feature)
│
├── UNITAIRES (10 tests)
│   ├── calculateDamage : 4 tests (nominal, défense > attaque, etc.)
│   ├── applyStatusEffect : 3 tests (ajout, remplacement, durée)
│   ├── consumeEnergy : 2 tests (suffisante, insuffisante)
│   └── isCombatOver : 1 test (HP <= 0)
│
├── PROPRIÉTÉS (3 tests fast-check)
│   ├── « dégâts toujours ≥ 1 »
│   ├── « PV ennemi toujours dans [0, maxHp] »
│   └── « un personnage mort ne peut pas attaquer »
│
├── INTÉGRATION + BDD (4 tests)
│   ├── CombatService.attack avec fakes : 2 tests
│   ├── Scenario BDD « Attaque psychique réussie »
│   └── Scenario BDD « Énergie insuffisante »
│
└── E2E (1 test)
    └── Parcours nouvelle partie → combat → victoire
```

Total : 18 tests pour une feature, ratio 55/17/22/6 (sur 100). Respect approximatif de la pyramide, avec ajout d'une couche property-based.

#### 🎯 Exercice rapide

**« Définir la stratégie de tests pour une feature "Quête principale" »** — Hawkins Lab Escape va ajouter un système de quêtes. Définis :
1. Combien de tests à chaque niveau (unit / property / intégration / BDD / E2E)
2. Quels comportements mettre à quel niveau (2 exemples par niveau)
3. Quels indicateurs surveiller après livraison

#### ✅ Correction

**1. Répartition cible** : 12 unitaires, 2 property-based, 4 intégration, 3 BDD, 2 E2E = 23 tests pour la feature.

**2. Comportements par niveau** :

- **Unitaires** :
  - `QuestProgress.advance(step)` met à jour l'étape courante
  - `QuestProgress.isComplete()` retourne `true` quand toutes les étapes sont validées
- **Property-based** :
  - « Pour toute séquence d'étapes, `QuestProgress.advance` ne régresse jamais »
  - « `QuestReward.apply` n'attribue jamais d'XP négatif »
- **Intégration** :
  - `QuestService` orchestre `QuestProgress` + `SaveService` + `RewardService`
  - Persistance d'une quête en cours et reprise après reload
- **BDD** :
  - « Démarrer une quête depuis un PNJ »
  - « Compléter une étape de quête en battant un ennemi spécifique »
- **E2E** :
  - Parcours complet : parler à un PNJ → accepter la quête → la compléter → recevoir la récompense
  - Quête bloquante : abandonner une quête en cours

**3. Indicateurs après livraison** :
- Taux de complétion des quêtes par les joueurs (analytics, pas test)
- Taux de bugs reportés liés aux quêtes (suivi tickets)
- Flakiness des tests E2E quête (cible : 0 %)
- Couverture du code de la feature (cible : > 85 %)
- Score de mutation sur le module quest (cible : > 75 %)

#### 🚀 Pistes d'exercices avancés

1. **Stratégie pour un projet legacy** — Prends un projet existant sans tests (ou presque). Définis un plan en 5 sprints pour atteindre une pyramide saine : quels tests écrire en priorité, dans quel ordre, et comment mesurer le progrès. Discute les arbitrages (commencer par les E2E pour couvrir rapidement, ou par les unitaires pour stabiliser ?).
2. **Tableau de bord de santé** — Construis un dashboard (peut-être une route admin dans Hawkins Lab Escape) qui affiche en temps réel : nombre de tests par niveau, dernière exécution CI, taux de flakiness, couverture, score de mutation. Quels signaux d'alerte automatiser (Slack, email) ?

---

### 8.3 — Projet fil rouge : synthèse pratique

#### 📖 Détail

Cette dernière séance est une **mise en pratique synthétique** où les participants appliquent l'ensemble des techniques apprises sur les 2 jours à une feature complète de Hawkins Lab Escape : la **gestion des sauvegardes multiples**. L'objectif : **mettre en cohérence** tout ce qu'on a vu — du test unitaire au test E2E, en passant par BDD, property-based et mutation testing.

**La feature à livrer** :
> En tant que joueur, je veux pouvoir gérer 3 slots de sauvegarde indépendants, afin de pouvoir tester différents choix de gameplay sans perdre ma progression principale.

**Le workflow complet à dérouler** (60-90 min) :

**Étape 1 — Conversation 3 amigos (5 min)**

PO, dev, testeur (joués par 3 participants) discutent : combien de slots ? Quels cas d'erreur ? Sauvegarde auto et manuelle distinctes ? Suppression de slot ?

**Étape 2 — Rédaction Gherkin (10 min)**

```gherkin
Feature: Gestion de slots de sauvegarde multiples

  Background:
    Given le jeu propose 3 slots de sauvegarde

  Scenario: Créer une sauvegarde dans un slot vide
    Given le slot 1 est vide
    When le joueur sauvegarde dans le slot 1
    Then le slot 1 contient l'état actuel
    And les slots 2 et 3 restent vides

  Scenario: Écraser une sauvegarde existante
    Given le slot 1 contient une sauvegarde du jour précédent
    When le joueur sauvegarde dans le slot 1
    Then le slot 1 contient l'état actuel

  Scenario: Charger un slot spécifique
    Given le slot 2 contient une sauvegarde de Mike au niveau 5
    When le joueur charge le slot 2
    Then le personnage actif est Mike au niveau 5

  Scenario: Supprimer une sauvegarde
    Given le slot 3 contient une sauvegarde
    When le joueur supprime le slot 3
    Then le slot 3 est vide

  Scenario: Refus de charger un slot vide
    Given le slot 2 est vide
    When le joueur tente de charger le slot 2
    Then l'action est refusée pour "Slot vide"
```

**Étape 3 — TDD des briques (20 min)**

En outside-in, partir du premier scénario qui échoue, descendre en TDD pour créer :
- `SaveSlotService.save(slotId, state)`
- `SaveSlotService.load(slotId)`
- `SaveSlotService.delete(slotId)`
- `SaveSlotService.listSlots()`

Chaque méthode est développée en Red-Green-Refactor avec AAA explicite.

**Étape 4 — Property-based testing (5 min)**

```typescript
it('save puis load retourne l\'état original (roundtrip)', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 3 }),
      gameStateArbitrary,
      (slotId, state) => {
        const service = new SaveSlotService(new InMemoryStorage());
        service.save(slotId, state);
        const loaded = service.load(slotId);
        return JSON.stringify(loaded?.state) === JSON.stringify(state);
      }
    )
  );
});
```

**Étape 5 — Génération des steps Cucumber (5 min)**

```typescript
Given('le slot {int} est vide', function (this: HawkinsWorld, slotId: number) {
  this.saveService.delete(slotId);
});

Given('le slot {int} contient une sauvegarde', function (this: HawkinsWorld, slotId: number) {
  this.saveService.save(slotId, makeGameState());
});

When('le joueur sauvegarde dans le slot {int}', function (this: HawkinsWorld, slotId: number) {
  this.lastResult = this.saveService.save(slotId, this.game.state);
});
```

**Étape 6 — Test d'intégration avec InMemoryStorage + MSW si backend (5 min)**

```typescript
describe('SaveSlotService + InMemoryStorage (intégration)', () => {
  it('persiste 3 slots indépendants sans interférence', () => {
    const storage = new InMemoryStorage();
    const service = new SaveSlotService(storage);

    service.save(1, makeGameState({ player: { name: 'Eleven' } }));
    service.save(2, makeGameState({ player: { name: 'Mike' } }));
    service.save(3, makeGameState({ player: { name: 'Will' } }));

    expect(service.load(1)?.state.player.name).toBe('Eleven');
    expect(service.load(2)?.state.player.name).toBe('Mike');
    expect(service.load(3)?.state.player.name).toBe('Will');
  });
});
```

**Étape 7 — Test E2E sur le parcours critique (10 min)**

```typescript
test('le joueur sauvegarde sur 3 slots et recharge le slot 2', async ({ page }) => {
  const home = new HomePage(page);
  const saveMenu = new SaveMenuPage(page);

  await home.goto();
  await home.startNewGame('Eleven');
  await saveMenu.open();
  await saveMenu.saveInSlot(1);
  await saveMenu.close();
  await saveMenu.open();
  await saveMenu.saveInSlot(2);

  await expect(saveMenu.getSlot(1)).toContainText('Eleven');
  await expect(saveMenu.getSlot(2)).toContainText('Eleven');
  await expect(saveMenu.getSlot(3)).toContainText('Vide');

  await saveMenu.loadSlot(1);
  await expect(page.getByText('Bienvenue à Hawkins')).toBeVisible();
});
```

**Étape 8 — Audit qualité (10 min)**

Checklist finale :
- ✅ AAA respecté dans tous les tests unitaires
- ✅ Aucun mock excessif (utilisation de fakes)
- ✅ Scénarios Gherkin sans vocabulaire UI
- ✅ Page Objects utilisés en E2E
- ✅ Pyramide respectée (compter les tests)
- ✅ Tous les tests verts en local et en CI
- ✅ Score de mutation > 70 % sur `SaveSlotService` (lancer Stryker)
- ✅ Property-based ne trouve aucun contre-exemple en 1000 itérations

**Bilan attendu** :
- ~12 tests unitaires
- 2-3 propriétés fast-check
- 2 tests d'intégration
- 5 scénarios BDD
- 1 test E2E

Soit ~22-25 tests, livrés en 60-90 minutes avec une couverture solide et un score de mutation élevé.

**Ce qu'on a vraiment construit** : une feature de production-grade testée à tous les niveaux, livrable en confiance. Plus important : on a démontré qu'il est possible de tenir une discipline de tests rigoureuse **sans ralentir** le développement, à condition de connaître les bons outils et les bons workflows.

#### 🧩 Exemple concret — Workflow chronométré

Déroulé idéal en temps réel :

| Temps | Action | Niveau de test |
|---|---|---|
| 00:00 | Brief de la feature, conversation 3 amigos | — |
| 00:05 | Rédaction Gherkin (5 scénarios) | BDD |
| 00:15 | TDD du SaveSlotService (4 méthodes, RGR) | Unitaire |
| 00:35 | Propriétés fast-check (roundtrip, indépendance des slots) | Property |
| 00:40 | Steps Cucumber implémentés | BDD |
| 00:50 | Tests d'intégration avec InMemoryStorage | Intégration |
| 00:55 | Page Object SaveMenuPage | E2E (préparation) |
| 01:00 | Test E2E complet | E2E |
| 01:10 | Stryker + audit qualité | Métriques |
| 01:20 | Livré ✅ | — |

#### 🎯 Exercice rapide

**« Mettre en cohérence pour une nouvelle feature »** — Choisis une feature manquante de Hawkins Lab Escape (système d'achievements, multiplayer turn-based, mini-jeu de cuisine d'Eggos, etc.). Déroule en 90 min les 8 étapes du workflow ci-dessus, en équipe ou en solo. Mesure :
- Temps total
- Nombre de tests à chaque niveau
- Score de mutation final
- Couverture obtenue
- Niveau de confiance personnel sur la feature livrée

#### ✅ Correction

Pas de correction unique (le résultat dépend de la feature choisie). Critères de réussite :

1. **Tous les niveaux de la pyramide sont représentés** (au moins 1 test par niveau)
2. **Tous les tests sont au vert** en fin d'exercice
3. **Aucun test n'est trivial** (Stryker tue les mutations introduites)
4. **La feature est livrable en production** (pas de TODO dans le code, pas de bugs apparents)
5. **Le développeur reste capable d'expliquer chaque ligne de code et de test**

#### 🚀 Pistes d'exercices avancés

1. **Migration d'une feature existante vers le workflow complet** — Prends une feature de Hawkins Lab Escape qui n'a actuellement que quelques tests unitaires épars. Applique-lui le workflow complet du 8.3 : ajout de scénarios BDD, tests d'intégration, E2E, propriétés fast-check, audit Stryker. Mesure la différence de confiance avant/après. Combien de bugs latents as-tu découverts ?
2. **Workflow d'équipe avec rôles spécialisés** — Avec 3-4 collègues, joue les rôles d'une équipe : un PO (qui guide la rédaction Gherkin), un dev (qui pilote le TDD), un QA (qui audite et challenge), un Tech Lead (qui valide la stratégie globale). Déroule le workflow sur une feature complexe (3-4 user stories). Documente ce qui change vs un workflow solo : où l'équipe ajoute de la valeur, où elle ralentit, comment se distribuent les responsabilités.

---

# 🎓 Synthèse globale de la formation

À l'issue de ces deux journées, les participants repartent avec une compétence solide en testing logiciel TypeScript :

**Ce qu'ils savent faire maintenant** :

- ✅ Écrire des tests unitaires propres (AAA, comportement, nommage français)
- ✅ Choisir les bons doubles (dummy, stub, spy, mock, fake) selon le contexte
- ✅ Concevoir une architecture testable (DI, interfaces, composition root)
- ✅ Piloter le code par les tests (TDD Red-Green-Refactor)
- ✅ Maîtriser les techniques avancées de mocking (fake timers, MSW)
- ✅ Structurer les données de test (factories, builders, fixtures)
- ✅ Utiliser le property-based testing avec fast-check pour révéler les bugs cachés
- ✅ Spécifier les comportements en BDD (Gherkin, Cucumber.js, Scenario Outline)
- ✅ Tester les parcours utilisateur avec Playwright (Page Object, sélecteurs robustes)
- ✅ Mesurer la qualité avec couverture et mutation testing (Stryker)
- ✅ Orchestrer une stratégie de tests cohérente (pyramide, CI/CD stratifiée)

**Le projet fil rouge Hawkins Lab Escape** restera une référence utilisable plus tard : structure, conventions, exemples concrets, helpers, Page Objects, fixtures, builders. Les participants peuvent le cloner, l'étendre, et l'utiliser comme bac à sable pour aller plus loin.

**Suite naturelle de la formation** :

- **Formation "Tests avec IA générative"** (1 jour, séparée) : utiliser Cursor et Claude Code pour générer, auditer et fiabiliser les tests
- **Tests d'accessibilité automatisés** avec axe-core
- **Tests de performance** avec Lighthouse CI
- **Contract testing** avec Pact pour les APIs externes
- **Tests de charge** avec k6 ou Artillery
- **Model-based testing** approfondi avec fast-check `commands`

**Le mot de la fin** : la qualité logicielle n'est pas une compétence technique parmi d'autres, c'est **le contrat moral** entre celui qui code et celui qui utilise. Les tests sont, et resteront, la preuve vivante de ce contrat. 🚀
