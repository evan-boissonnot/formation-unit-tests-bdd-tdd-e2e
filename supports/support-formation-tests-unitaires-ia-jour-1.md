# SUPPORT DE COURS — TESTS UNITAIRES AVEC IA · JOUR 1

> **Formation** : Tests unitaires avec IA générative — Distanciel synchrone — 1 jour (7 heures)
> **Public** : Développeurs, QA techniques, Tech leads
> **Outils** : Claude Code / Cursor (IA) · Vitest (unitaires) · Cucumber.js + Gherkin (BDD)
> **Projet fil rouge** : **Hawkins Lab Escape** — RPG tour par tour en TypeScript

---

## 🎮 Présentation du projet fil rouge — Hawkins Lab Escape

Pendant cette journée, nous travaillons sur **Hawkins Lab Escape**, un RPG tour par tour où le joueur incarne un personnage tentant de s'échapper du laboratoire de Hawkins et de survivre dans l'Upside Down. Le jeu présente toutes les caractéristiques d'un projet « réel » du point de vue du testing :

- **Logique métier pure** (calcul de dégâts, gestion d'inventaire, règles de combat) → idéal pour tests unitaires
- **Dépendances externes** (RNG, stockage, horloge) → idéal pour mocking et injection de dépendance
- **Workflows utilisateur** (créer un perso, lancer un combat, sauvegarder) → idéal pour BDD

### Structure de base du projet

```
hawkins-lab-escape/
├── src/
│   ├── domain/
│   │   ├── character.ts
│   │   ├── enemy.ts
│   │   ├── ability.ts
│   │   ├── item.ts
│   │   ├── inventory.ts
│   │   └── combat.ts
│   ├── services/
│   │   ├── random.service.ts
│   │   ├── save.service.ts
│   │   └── clock.service.ts
│   └── game.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── bdd/
│   │   ├── features/
│   │   ├── steps/
│   │   └── support/
│   └── helpers/
│       └── factories.ts
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### Modèle de domaine de référence

```typescript
// src/domain/character.ts
export type StatType = 'hp' | 'maxHp' | 'energy' | 'maxEnergy' | 'attack' | 'defense';

export interface Character {
  id: string;
  name: string;
  stats: Record<StatType, number>;
  inventory: Item[];
  abilities: Ability[];
  statusEffects: StatusEffect[];
}

export interface Item {
  id: string;
  name: string;
  type: 'consumable' | 'weapon' | 'key';
  power?: number;
}

export interface Ability {
  id: string;
  name: string;
  energyCost: number;
  baseDamage: number;
  element?: 'psychic' | 'physical' | 'fire';
}

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
}

export interface StatusEffect {
  id: 'stunned' | 'poisoned' | 'buffed';
  remainingTurns: number;
}
```

### Factories de test (helpers)

```typescript
// tests/helpers/factories.ts
import type { Character, Enemy, Ability, Item, StatusEffect } from '../../src/domain/character';

export const makeCharacter = (overrides: Partial<Character & { hp: number; maxHp: number; attack: number; defense: number; energy: number; maxEnergy: number }> = {}): Character => ({
  id: 'eleven',
  name: 'Eleven',
  stats: {
    hp: overrides.hp ?? 100,
    maxHp: overrides.maxHp ?? 100,
    energy: overrides.energy ?? 50,
    maxEnergy: overrides.maxEnergy ?? 50,
    attack: overrides.attack ?? 10,
    defense: overrides.defense ?? 5,
  },
  inventory: [],
  abilities: [],
  statusEffects: overrides.statusEffects ?? [],
  ...overrides,
});

export const makeEnemy = (overrides: Partial<Enemy> = {}): Enemy => ({
  id: 'demogorgon-1',
  name: 'Demogorgon',
  hp: 50,
  maxHp: 50,
  attack: 12,
  defense: 3,
  ...overrides,
});

export const makeAbility = (overrides: Partial<Ability> = {}): Ability => ({
  id: 'psychic-blast',
  name: 'Psychic Blast',
  energyCost: 5,
  baseDamage: 8,
  ...overrides,
});

export const makeItem = (overrides: Partial<Item> = {}): Item => ({
  id: 'item-1',
  name: 'Potion',
  type: 'consumable',
  power: 10,
  ...overrides,
});
```

---

# 🌅 MATIN

---

## Module 1 — Introduction au principe du testing

### 1.1 — Que sont les tests et pourquoi tester ?

#### 📖 Détail

Un test logiciel est un **programme qui exécute un autre programme pour vérifier que son comportement correspond à une attente formalisée**. Cette définition apparemment banale cache une révolution méthodologique : la vérification du logiciel cesse d'être une activité humaine subjective et ponctuelle (« je clique partout et ça marche ») pour devenir une activité automatisée, reproductible et exécutée des centaines de fois par jour.

On distingue traditionnellement plusieurs **niveaux de tests** organisés selon la pyramide popularisée par Mike Cohn. À la base, les **tests unitaires** vérifient une unité isolée de code (fonction, méthode, classe) sans dépendance externe : ils sont rapides (millisecondes), nombreux (des milliers), et constituent la majorité des tests d'un projet sain. Au milieu, les **tests d'intégration** vérifient que plusieurs unités collaborent correctement (un service avec son repository, deux modules entre eux) ; ils sont plus lents et moins nombreux. Au sommet, les **tests end-to-end (E2E)** valident un parcours utilisateur complet à travers toute la stack (UI, API, base de données) ; ils sont lents (secondes voire minutes), fragiles, et doivent rester rares.

**Pourquoi tester ?** Au-delà de l'évidence (« pour ne pas livrer de bugs »), les tests automatisés remplissent quatre fonctions cruciales souvent sous-estimées. Premièrement, ils **documentent le comportement attendu** du code : un test bien nommé est une spécification exécutable que ni un README ni un commentaire ne peut concurrencer, car il est vérifié par la machine à chaque commit. Deuxièmement, ils **autorisent le refactoring** : sans filet de sécurité, modifier du code existant devient un acte de foi. Avec une suite de tests, on transforme l'amélioration continue en activité quotidienne sans risque. Troisièmement, ils **guident la conception** : du code difficile à tester est presque toujours du code mal conçu (couplage trop fort, responsabilités mal séparées, dépendances cachées). Le test est ainsi un révélateur architectural. Quatrièmement, ils **accélèrent le développement à moyen et long terme** : la courbe est contre-intuitive — on perd du temps les premières semaines, on en gagne énormément dès le troisième mois.

Dans un contexte de **développement assisté par IA**, ces fonctions deviennent encore plus critiques. L'IA peut générer du code à une vitesse inédite, mais elle peut aussi générer des bugs subtils, des régressions silencieuses, des hallucinations d'API. Sans tests, on devient incapable de distinguer le bon code généré du mauvais. Le test devient alors le **garde-fou indispensable de la collaboration humain-IA** : c'est lui qui valide ce que l'IA produit, et c'est lui que l'IA peut elle-même produire pour spécifier le code qu'elle va écrire ensuite (workflow TDD assisté).

Plusieurs **types de tests non-fonctionnels** complètent la pyramide : tests de performance (temps de réponse), tests de charge (montée en utilisateurs), tests de sécurité, tests d'accessibilité, tests de mutation (qui altèrent le code pour vérifier que les tests détectent les altérations). Nous nous concentrerons sur les tests fonctionnels dans cette formation, mais il est essentiel d'avoir cette cartographie en tête.

Enfin, méfions-nous d'un piège classique : **la couverture de code n'est pas une mesure de qualité de tests**. Atteindre 100 % de couverture en testant uniquement les getters et les chemins faciles donne une fausse impression de sécurité. Ce qui compte, c'est de tester les comportements significatifs, les cas limites, et les invariants métier. Un projet à 70 % de couverture avec des tests qui valident des comportements critiques est largement supérieur à un projet à 95 % de couverture rempli de tests triviaux.

#### 🧩 Exemple concret

Reprenons un calcul de dégâts dans Hawkins Lab Escape. Sans test, on a une fonction et un espoir :

```typescript
// src/domain/combat.ts
import type { Character, Enemy, Ability } from './character';

export function calculateDamage(
  attacker: Character,
  defender: Enemy,
  ability: Ability
): number {
  const base = ability.baseDamage + attacker.stats.attack;
  const reduced = Math.max(1, base - defender.defense);
  return reduced;
}
```

Avec un test, on documente, on vérifie, et on protège :

```typescript
// tests/unit/combat.test.ts
import { describe, it, expect } from 'vitest';
import { calculateDamage } from '../../src/domain/combat';
import { makeCharacter, makeEnemy, makeAbility } from '../helpers/factories';

describe('calculateDamage', () => {
  it('inflige au minimum 1 point de dégât même si la défense est supérieure à l\'attaque', () => {
    const eleven = makeCharacter({ attack: 5 });
    const demogorgon = makeEnemy({ defense: 100 });
    const punch = makeAbility({ baseDamage: 2 });

    expect(calculateDamage(eleven, demogorgon, punch)).toBe(1);
  });
});
```

Ce test capture une règle métier (« on ne peut jamais infliger 0 dégât ») qui ne se voit pas dans le nom de la fonction, et la garantit pour l'éternité.

#### 🎯 Exercice rapide

**« Identifier les règles métier cachées »** — Voici une fonction `canEquipWeapon(character, weapon)` qui retourne `true` ou `false`. Sans modifier la fonction, écris trois tests qui révèlent les règles implicites :

```typescript
export function canEquipWeapon(c: Character, w: Item): boolean {
  if (w.type !== 'weapon') return false;
  if (c.stats.hp <= 0) return false;
  if (c.statusEffects.some(e => e.id === 'stunned')) return false;
  return true;
}
```

#### ✅ Correction

```typescript
import { describe, it, expect } from 'vitest';
import { canEquipWeapon } from '../../src/domain/equipment';
import { makeCharacter, makeItem } from '../helpers/factories';

describe('canEquipWeapon', () => {
  it('refuse l\'équipement quand l\'item n\'est pas une arme', () => {
    const eleven = makeCharacter({ hp: 10 });
    const potion = makeItem({ type: 'consumable' });

    expect(canEquipWeapon(eleven, potion)).toBe(false);
  });

  it('refuse l\'équipement quand le personnage est mort (hp <= 0)', () => {
    const eleven = makeCharacter({ hp: 0 });
    const sword = makeItem({ type: 'weapon' });

    expect(canEquipWeapon(eleven, sword)).toBe(false);
  });

  it('refuse l\'équipement quand le personnage est étourdi', () => {
    const eleven = makeCharacter({
      hp: 10,
      statusEffects: [{ id: 'stunned', remainingTurns: 2 }],
    });
    const sword = makeItem({ type: 'weapon' });

    expect(canEquipWeapon(eleven, sword)).toBe(false);
  });
});
```

#### 🚀 Pistes d'exercices avancés

1. **Test de mutation manuelle** — Modifie volontairement la fonction (ex. retire la condition `hp <= 0`) et vérifie que tes tests détectent la régression. Si un test ne casse pas, il manque un cas. Itère jusqu'à ce que chaque mutation soit détectée par au moins un test.
2. **Property-based testing avec `fast-check`** — Écris une propriété qui exprime : « pour tout personnage vivant non-étourdi, et toute arme, `canEquipWeapon` retourne `true` ». L'outil génère 100+ inputs aléatoires et tente de la casser, révélant les cas auxquels tu n'avais pas pensé.

---

### 1.2 — Écrire son premier test : anatomie d'un bon test

#### 📖 Détail

Un test, c'est facile à écrire. Un **bon** test, c'est une discipline. La différence ne se voit pas le jour où on l'écrit, mais des mois plus tard, quand un membre de l'équipe doit comprendre pourquoi il échoue ou si on peut le supprimer. Sept caractéristiques distinguent un bon test d'un test médiocre.

**1. Un test a un nom qui décrit le comportement attendu, pas l'implémentation.** Comparons : `it('test1', ...)` vs `it('returns 0', ...)` vs `it('retourne 0 dégât quand l\'attaquant est étourdi', ...)`. Seul le troisième survit à la lecture par un humain qui ne connaît pas le code. La convention française que je recommande est « il/elle fait X quand Y » : tournure naturelle, lisible dans le rapport de test. En anglais, on utilise souvent le pattern `should_DoSomething_When_Condition`.

**2. Un test teste une seule chose à la fois.** Si un test échoue, le développeur doit savoir immédiatement quoi a régressé. Un test qui fait trois assertions sur trois comportements distincts est en réalité trois tests cachés dans un seul. Cela ne signifie pas « une seule assertion » : on peut avoir plusieurs `expect` qui vérifient différentes facettes du même comportement (ex. `expect(result.hp).toBe(10)` et `expect(result.status).toBe('alive')` pour vérifier l'état d'un personnage après une action). La règle est : **un seul concept testé**.

**3. Un test est déterministe.** Il donne le même résultat à chaque exécution, qu'on soit lundi à 9h ou samedi à 23h, sur Linux ou Mac, en France ou au Japon. Les ennemis du déterminisme : `Math.random()`, `new Date()`, `setTimeout`, appels réseau, lecture de fichiers, ordre des éléments dans un `Set`. Tous ces éléments doivent être **contrôlés** dans le test (mocking, injection, fake timers).

**4. Un test est rapide.** Un test unitaire doit s'exécuter en quelques millisecondes. Si un test prend 200 ms, c'est qu'il fait probablement de l'I/O ou attend un timer. Sur une suite de 2000 tests, la différence entre 5 ms et 200 ms par test est colossale : 10 secondes vs 7 minutes. Une suite lente ne tournera plus en local, ne tournera plus à chaque sauvegarde, et finira par ne plus tourner du tout.

**5. Un test est isolé.** Il ne dépend pas de l'ordre d'exécution. Si on inverse les tests, tout fonctionne. Les outils modernes (Vitest, Jest) randomisent l'ordre par défaut pour détecter les fuites d'état entre tests. Un test qui pollue une variable globale, un fichier sur disque, ou une base de données partagée cassera tôt ou tard.

**6. Un test est lisible.** On doit comprendre en 5 secondes ce qu'il vérifie. Un test n'est pas du code de production : on accepte un peu de répétition, des constantes magiques en clair, des structures littérales. La règle d'or : **un développeur qui ne connaît pas le code de production doit pouvoir lire le test et deviner ce que fait le code testé**.

**7. Un test échoue de manière informative.** Quand il casse, le message d'erreur doit pointer la cause. `expect(result).toBe(true)` qui échoue dit juste « false n'était pas true » — inutile. `expect(combat.isOver).toBe(true)` dit « le combat aurait dû être terminé » — utile. Privilégier les matchers riches (`toEqual`, `toContain`, `toMatchObject`, `toThrow`) aux assertions génériques.

Ces sept caractéristiques sont en tension : un test trop lisible peut devenir verbeux ; un test trop isolé peut devenir trop loin du réel. C'est l'expérience qui permet de trouver l'équilibre. L'IA peut aider énormément ici : un prompt bien rédigé du type « génère-moi un test pour cette fonction en respectant AAA, avec un nom descriptif en français, et un seul comportement testé » donne souvent un meilleur résultat qu'un test écrit à la main par un développeur fatigué.

#### 🧩 Exemple concret

```typescript
// ❌ Mauvais test
it('test heal', () => {
  const c = { stats: { hp: 5, maxHp: 10 } } as Character;
  heal(c, 3);
  expect(c.stats.hp).toBe(8);
  heal(c, 100);
  expect(c.stats.hp).toBe(10);
  expect(c.stats.hp).not.toBe(0);
});

// ✅ Bon test (refactorisé en plusieurs)
describe('heal', () => {
  it('ajoute la quantité de soin aux PV courants', () => {
    const eleven = makeCharacter({ hp: 5, maxHp: 10 });

    heal(eleven, 3);

    expect(eleven.stats.hp).toBe(8);
  });

  it('plafonne les PV au maximum autorisé', () => {
    const eleven = makeCharacter({ hp: 5, maxHp: 10 });

    heal(eleven, 100);

    expect(eleven.stats.hp).toBe(10);
  });
});
```

Le premier test viole 4 caractéristiques sur 7 (nom flou, plusieurs concepts testés, assertion finale absurde, séparation AAA invisible). Le second les respecte toutes.

#### 🎯 Exercice rapide

**« Réécrire un mauvais test »** — Voici un test à reformuler en respectant les 7 caractéristiques :

```typescript
it('works', () => {
  const e = new Enemy('demogorgon', 50, 10, 5);
  e.takeDamage(20);
  e.takeDamage(100);
  expect(e.hp).toBeLessThan(50);
  expect(e.isAlive()).toBe(false);
  expect(new Date().getTime()).toBeGreaterThan(0);
});
```

#### ✅ Correction

```typescript
describe('Enemy.takeDamage', () => {
  it('réduit les PV de la quantité de dégâts reçus', () => {
    const demogorgon = new Enemy('demogorgon', 50, 10, 5);

    demogorgon.takeDamage(20);

    expect(demogorgon.hp).toBe(30);
  });

  it('plafonne les PV à zéro quand les dégâts dépassent les PV restants', () => {
    const demogorgon = new Enemy('demogorgon', 50, 10, 5);

    demogorgon.takeDamage(9999);

    expect(demogorgon.hp).toBe(0);
  });

  it('passe l\'ennemi en état "mort" quand ses PV atteignent zéro', () => {
    const demogorgon = new Enemy('demogorgon', 50, 10, 5);

    demogorgon.takeDamage(50);

    expect(demogorgon.isAlive()).toBe(false);
  });
});
```

L'assertion sur `new Date()` a été supprimée : elle ne testait rien d'utile et introduisait une dépendance temporelle non-déterministe.

#### 🚀 Pistes d'exercices avancés

1. **Audit d'une suite existante** — Prends 10 tests d'un projet open-source connu (lodash, RxJS, date-fns) et score-les sur les 7 caractéristiques. Combien obtiennent 7/7 ? Identifie les patterns récurrents de tests faibles dans le code open source mature.
2. **DSL fluent pour les tests** — Construis un mini-DSL `aCharacter().named('Eleven').withHp(10).stunned().build()` qui rend les tests narrativement lisibles, puis réécris les tests précédents avec ce DSL. Évalue l'impact en lisibilité et en facilité de création de cas complexes.

---

### 1.3 — Composition d'un test : Arrange, Act, Assert

#### 📖 Détail

Le pattern **AAA — Arrange, Act, Assert** — est la structure canonique d'un test bien écrit. Il s'agit d'une discipline simple à énoncer, plus subtile à appliquer : chaque test se découpe en trois sections clairement identifiables, dans cet ordre, sans mélange.

**Arrange (Préparer)** : on construit le contexte du test. Ici, on instancie les objets, on configure les mocks, on prépare les données d'entrée, on définit l'état initial du système sous test (SUT — *System Under Test*). Cette section est typiquement la plus volumineuse, et c'est normal : c'est là qu'on rend le test compréhensible en exposant explicitement ce qui rend le scénario unique. Un anti-pattern courant consiste à externaliser tout le Arrange dans un `beforeEach` géant ; ça raccourcit les tests mais ça rend chacun illisible isolément. Préférer des **factory helpers** (cf. `makeCharacter`, `makeEnemy`) qui rendent l'Arrange concis sans le cacher.

**Act (Agir)** : on exécute l'action qu'on souhaite tester. Idéalement, c'est **une seule ligne** : un appel de fonction, une invocation de méthode, un dispatch. Si la section Act fait plus d'une ligne, c'est souvent qu'on teste deux comportements à la fois, ou qu'on devrait extraire une méthode plus haut-niveau dans le code de production. Cette contrainte (« Act doit tenir en une ligne ») est un excellent révélateur de design : si c'est impossible, le code de production est probablement trop fragmenté ou la responsabilité testée est mal définie.

**Assert (Vérifier)** : on vérifie le résultat. Il peut y avoir plusieurs assertions ici, à condition qu'elles portent toutes sur le même comportement. Le tag « assert » couvre trois familles de vérifications : le résultat retourné par la fonction (`expect(result).toBe(...)`), l'état modifié de l'objet (`expect(character.hp).toBe(...)`), ou les interactions avec les dépendances (`expect(mockSave).toHaveBeenCalledWith(...)`).

Une variante populaire du AAA est **Given-When-Then**, héritée du BDD. La sémantique est identique :
- Given = Arrange
- When = Act
- Then = Assert

Le Given-When-Then est généralement utilisé en commentaire dans les tests unitaires, ou directement dans les fichiers Gherkin pour le BDD (cf. module 3).

**Quelques pièges à éviter** :

1. **Mélanger Arrange et Act** — instancier un objet et appeler sa méthode dans le même bloc rend l'intention floue. Préférer un saut de ligne entre les sections.
2. **Faire plusieurs Act** — souvent symptôme d'un test qui fait trop de choses. Coupez-le en deux.
3. **Assertions en plein Arrange** — vérifier l'état initial avec un `expect` avant l'Act est rarement utile et pollue le test. Si on doute, c'est qu'on devrait mocker plus fortement.
4. **Pas de blank line entre les sections** — petit détail mais énorme gain de lisibilité. Les yeux scannent en quelques secondes.

L'IA est particulièrement efficace pour appliquer ce pattern. Un prompt du type « génère un test Vitest avec la structure AAA bien visible (saut de ligne entre Arrange, Act, Assert) » produit des tests structurés. Mieux : on peut demander à l'IA d'**auditer un test existant** et de signaler les violations AAA.

Enfin, le AAA s'applique aussi bien aux tests synchrones qu'aux tests asynchrones. Dans ce dernier cas, l'Act devient un `await fonction()`, et il faut bien gérer les Promesses dans les assertions (`await expect(promise).rejects.toThrow(...)` plutôt que `expect(promise).rejects.toThrow(...)` qui ne fait rien).

#### 🧩 Exemple concret

```typescript
// tests/unit/combat.test.ts
import { describe, it, expect } from 'vitest';
import { executeAttack } from '../../src/domain/combat';
import { makeCharacter, makeEnemy, makeAbility } from '../helpers/factories';

describe('executeAttack', () => {
  it('réduit les PV de l\'ennemi de la quantité de dégâts infligés et consomme l\'énergie de l\'ability', () => {
    // Arrange
    const eleven = makeCharacter({ attack: 10, energy: 20 });
    const demogorgon = makeEnemy({ hp: 50, defense: 2 });
    const psychicBlast = makeAbility({ baseDamage: 8, energyCost: 5 });

    // Act
    const result = executeAttack(eleven, demogorgon, psychicBlast);

    // Assert
    expect(result.defenderHpAfter).toBe(34); // 50 - (10 + 8 - 2)
    expect(result.attackerEnergyAfter).toBe(15); // 20 - 5
  });
});
```

#### 🎯 Exercice rapide

**« Réécrire en AAA »** — Refactorise ce test pour faire apparaître clairement les trois sections :

```typescript
it('saves the game', () => {
  expect(new SaveService(new InMemoryStorage(), () => new Date('2025-01-01')).save({ scene: 'lab', hp: 100 })).toEqual({ success: true, savedAt: new Date('2025-01-01') });
});
```

#### ✅ Correction

```typescript
it('retourne un succès et un horodatage quand la sauvegarde aboutit', () => {
  // Arrange
  const storage = new InMemoryStorage();
  const fixedDate = new Date('2025-01-01');
  const saveService = new SaveService(storage, () => fixedDate);
  const gameState = { scene: 'lab', hp: 100 };

  // Act
  const result = saveService.save(gameState);

  // Assert
  expect(result).toEqual({
    success: true,
    savedAt: fixedDate,
  });
});
```

#### 🚀 Pistes d'exercices avancés

1. **Linter AAA personnalisé** — Écris un script Node qui parse les fichiers `.test.ts`, identifie chaque `it(...)` et signale les tests dont l'Act fait plus d'une ligne, ou dont la séparation AAA n'est pas matérialisée par des sauts de ligne. Bonus : intègre-le en hook pre-commit avec Husky.
2. **AAA asynchrone et `vi.useFakeTimers`** — Réécris le test précédent avec un `SaveService` qui retourne une `Promise<SaveResult>` après un délai de 500 ms (compression d'écriture). Utilise `vi.useFakeTimers()` + `vi.advanceTimersByTime(500)` pour conserver un Act sur une seule ligne (`await saveService.save(...)`) et une suite rapide.

---

### 1.4 — Tester le comportement, pas l'implémentation

#### 📖 Détail

C'est sans doute le principe le plus important — et le plus violé — du testing professionnel. Un test doit valider **ce que le code fait** (son comportement observable), pas **comment il le fait** (sa structure interne). La distinction paraît philosophique ; elle est en réalité éminemment pratique et conditionne la valeur de votre suite de tests sur le long terme.

**Un test couplé à l'implémentation casse au moindre refactoring.** Imaginez que vous testez une fonction `calculateDamage` en vérifiant qu'elle appelle bien une méthode `_applyArmorReduction` en interne. Le jour où vous refactorisez en inlinant cette méthode (parce qu'elle ne servait qu'à un seul endroit), votre test casse — alors que le comportement public n'a pas changé. Vous avez payé un test qui vous **empêche** d'améliorer le code au lieu de vous protéger. C'est l'antithèse du rôle d'un test.

**Un test orienté comportement résiste aux refactorings.** Le même test, écrit en termes d'entrée/sortie (« avec ces stats, l'attaque doit infliger 12 dégâts »), survit à tous les refactorings tant que la règle métier ne change pas. Vous pouvez réécrire la fonction en trois lignes ou en trente, l'extraire en classe ou la transformer en pure function : le test continue de valider le bon comportement.

Concrètement, **qu'est-ce que le comportement observable ?** C'est ce qu'un utilisateur (humain ou code appelant) peut constater :
- La valeur retournée par la fonction
- L'état observable de l'objet après l'action (via ses getters/propriétés publiques)
- Les exceptions levées
- Les effets de bord vers des dépendances explicitement injectées (appel d'un repository, d'un logger…)

**Qu'est-ce que l'implémentation ?** C'est tout le reste :
- Les méthodes privées
- Les variables internes intermédiaires
- L'ordre des opérations internes
- Les structures de données utilisées en interne (Map vs Object, Array vs Set)

Un piège fréquent : **tester les méthodes privées**. La tentation est forte, surtout en TypeScript où on peut tricher avec `// @ts-ignore` ou en exposant les méthodes en `public`. C'est une erreur. Si une méthode privée est complexe au point de mériter ses propres tests, c'est qu'elle a probablement une responsabilité distincte qui devrait vivre dans une classe à part — et qui devient alors testable publiquement. La règle : si vous voulez tester une méthode privée, **extrayez-la d'abord**.

Autre piège : **les snapshots trop larges**. Un snapshot qui sérialise tout l'état d'un objet créera une fausse alerte au moindre changement de structure. Préférer des assertions ciblées (`expect(result.hp).toBe(10)`) ou des snapshots partiels (`expect(result).toMatchObject({ hp: 10 })`).

Dans le contexte de **l'IA assistante**, cette discipline est cruciale. L'IA, par défaut, génère souvent des tests qui mockent trop, qui vérifient des appels internes, qui examinent l'implémentation. C'est en partie parce qu'elle imite ce qu'elle a vu dans ses données d'entraînement (souvent du code mal testé). Le réflexe à avoir : **toujours relire un test généré et se demander « ce test casserait-il si je refactorisais sans changer le comportement ? »**. Si la réponse est oui, le test est à réécrire.

Cas particulier : **les classes qui ont des collaborateurs**. Si une classe `CombatEngine` appelle un `RandomService` pour générer un nombre aléatoire, faut-il vérifier que `RandomService.next()` a été appelé ? Réponse nuancée : on vérifie l'**interaction** uniquement si elle fait partie du contrat public de `CombatEngine`. Si l'aléatoire est un détail d'implémentation (on pourrait remplacer `Math.random()` par un autre algorithme), on teste plutôt la distribution observable des résultats. Si en revanche le contrat de `CombatEngine` est « j'utilise toujours le RNG injecté pour la fairness », alors oui, on vérifie l'appel.

#### 🧩 Exemple concret

```typescript
// ❌ Test couplé à l'implémentation
it('appelle bien _calculateBase puis _applyDefense', () => {
  const combat = new CombatEngine();
  const spyBase = vi.spyOn(combat as any, '_calculateBase');
  const spyDef = vi.spyOn(combat as any, '_applyDefense');

  combat.attack(eleven, demogorgon, ability);

  expect(spyBase).toHaveBeenCalled();
  expect(spyDef).toHaveBeenCalled();
});

// ✅ Test orienté comportement
it('inflige des dégâts à l\'ennemi en tenant compte de sa défense', () => {
  const combat = new CombatEngine();
  const eleven = makeCharacter({ attack: 15 });
  const demogorgon = makeEnemy({ hp: 30, defense: 5 });
  const ability = makeAbility({ baseDamage: 10 });

  combat.attack(eleven, demogorgon, ability);

  expect(demogorgon.hp).toBe(10); // 30 - (15 + 10 - 5) = 10
});
```

Le premier test casse dès qu'on inline `_calculateBase` ou qu'on renomme `_applyDefense`. Le second survit à n'importe quel refactoring tant que la règle métier reste la même.

#### 🎯 Exercice rapide

**« Repérer le couplage »** — Pour chaque test ci-dessous, dis s'il teste un comportement ou une implémentation, et propose une reformulation si nécessaire :

```typescript
// Test A
it('a une propriété _internalState qui vaut "idle" au démarrage', () => {
  const game = new Game();
  expect((game as any)._internalState).toBe('idle');
});

// Test B
it('renvoie "GAME_OVER" quand le joueur est mort', () => {
  const game = new Game({ player: makeCharacter({ hp: 0 }) });
  expect(game.getStatus()).toBe('GAME_OVER');
});

// Test C
it('appelle map() puis filter() sur l\'inventaire', () => {
  const spyMap = vi.spyOn(Array.prototype, 'map');
  inventory.getUsableItems();
  expect(spyMap).toHaveBeenCalled();
});
```

#### ✅ Correction

- **Test A** — Couplé à l'implémentation. La propriété `_internalState` est privée (préfixe `_`), et le test triche avec `as any`. Reformulation : tester l'état observable via une méthode publique.
  ```typescript
  it('démarre en état "idle"', () => {
    const game = new Game();
    expect(game.getStatus()).toBe('idle');
  });
  ```
- **Test B** — Orienté comportement. Il valide la sortie publique en fonction d'une entrée. À garder tel quel.
- **Test C** — Très couplé à l'implémentation, et qui plus est fragile (espionner les méthodes natives d'`Array` est presque toujours une mauvaise idée). Reformulation : tester ce que retourne `getUsableItems`, pas comment elle est calculée.
  ```typescript
  it('retourne uniquement les items utilisables (consommables)', () => {
    const inv = new Inventory([
      makeItem({ type: 'consumable' }),
      makeItem({ type: 'weapon' }),
    ]);

    const usable = inv.getUsableItems();

    expect(usable).toHaveLength(1);
    expect(usable[0].type).toBe('consumable');
  });
  ```

#### 🚀 Pistes d'exercices avancés

1. **Refactoring sans casser les tests** — Prends une fonction couverte par 5 tests. Refactorise-la de trois manières différentes (extraction de fonction, inlining d'une variable, changement de Map vers Object). Combien de tests restent verts ? Si certains cassent, sont-ils couplés à l'implémentation ? Réécris-les en orienté comportement.
2. **Test d'invariant avec `fast-check`** — Avec `fast-check`, écris une propriété qui exprime un invariant métier (ex. « après n'importe quel calcul de dégâts, les PV de l'ennemi sont toujours ≥ 0 et ≤ maxHp »). Tu ne testes plus un cas, tu testes une règle universelle, indépendante de toute implémentation.

---

## Module 2 — Mock et architecture

### 2.1 — Le besoin de mocker

#### 📖 Détail

Mocker, c'est **remplacer une dépendance réelle par un substitut contrôlé** le temps d'un test. C'est l'outil principal qui permet de respecter le « U » d'« unitaire » : sans mocking, un test qui touche à une base de données, à un appel HTTP ou à une horloge système devient lent, flaky, et couplé à des choses qu'on ne devrait pas tester ici.

**Pourquoi mocker ?** Quatre raisons principales structurent la décision.

Premièrement, **l'isolation**. Un test unitaire doit valider une seule unité de code. Si la fonction sous test appelle un service de sauvegarde qui touche un fichier disque, on teste implicitement deux unités. Si le test casse, on ne sait pas laquelle est en faute. Le mock substitue le service de sauvegarde par un objet qui dit « oui, j'ai enregistré » sans rien faire.

Deuxièmement, **la performance**. Un appel réseau, c'est 50 ms à 500 ms minimum. Multiplié par 1000 tests, on passe d'une suite de 5 secondes à une suite de 8 minutes. Inacceptable pour du développement TDD où on veut un feedback en moins d'une seconde.

Troisièmement, **le déterminisme**. `Math.random()`, `new Date()`, l'ordre des événements asynchrones, les conditions réseau : autant de sources de flakiness. Le mock fige ces sources de variance et les rend prévisibles.

Quatrièmement, **les cas difficiles à reproduire**. Comment tester qu'une fonction gère bien une panne de base de données ? Tu ne vas pas vraiment couper la base. Le mock peut simuler n'importe quel scénario d'erreur en une ligne (`mockReject(new Error('Connection lost'))`).

**Mais attention au sur-mocking.** Le pendant négatif du mocking est qu'il introduit un découplage entre le test et la réalité. Si tu mockes ton repository pour qu'il retourne `{ user: 'eleven' }` mais que la vraie base retourne `{ userName: 'eleven' }`, ton test passe mais le code de production casse. C'est un risque systémique des tests fortement mockés, qu'on appelle parfois « tester le mock plutôt que le code ».

Règle pratique : **mockez les frontières, pas le cœur**. Les frontières (I/O, réseau, horloge, RNG, utilisateurs externes) doivent être mockées car elles sont lentes, instables, ou difficiles à reproduire. Le cœur de votre logique métier (calculs, règles, transformations) ne doit pas être mocké : c'est précisément ce que vous voulez tester.

**Comment décide-t-on de mocker ?** Trois critères :
1. **Lenteur** : la dépendance prend > 10 ms ? → mock
2. **Indéterminisme** : la dépendance peut retourner des résultats différents pour une même entrée (RNG, horloge, réseau) ? → mock
3. **Effet de bord non-souhaité** : la dépendance modifie un système externe (DB, fichier, email) ? → mock

Si aucun critère n'est rempli, **ne mockez pas**. Une dépendance pure et rapide doit être utilisée telle quelle. Mocker un calculateur de dégâts pour tester un orchestrateur de combat est presque toujours une erreur : ça duplique la logique métier dans les tests et fragmente la confiance.

Dans le contexte de l'IA, la rédaction de mocks est l'un des cas d'usage où elle excelle. Un prompt du type « génère un mock Vitest pour cette interface `SaveService`, avec une implémentation par défaut qui retourne success et un horodatage » donne en quelques secondes un fake complet, typé, et utilisable. Mais l'IA, comme dit plus haut, a tendance à sur-mocker. **Toujours auditer un test généré pour vérifier qu'aucun mock n'est superflu.**

Enfin, **mocker oblige à concevoir pour la testabilité**. Si vous ne pouvez pas mocker une dépendance, c'est qu'elle est probablement instanciée en dur dans la fonction sous test (`new HttpClient()` dans le constructeur). La solution est l'injection de dépendance, que nous verrons en 2.3.

#### 🧩 Exemple concret

```typescript
// src/services/save.service.ts
export interface Storage {
  setItem(key: string, value: string): void;
  getItem(key: string): string | null;
}

export class SaveService {
  constructor(private storage: Storage, private clock: () => Date) {}

  save(state: GameState): SaveResult {
    const savedAt = this.clock();
    const payload = JSON.stringify({ state, savedAt: savedAt.toISOString() });
    this.storage.setItem('hawkins-save', payload);
    return { success: true, savedAt };
  }
}

// tests/unit/save.service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { SaveService, Storage } from '../../src/services/save.service';

describe('SaveService.save', () => {
  it('persiste l\'état du jeu sous la clé "hawkins-save"', () => {
    // Arrange
    const fakeStorage: Storage = {
      setItem: vi.fn(),
      getItem: vi.fn(() => null),
    };
    const fixedDate = new Date('2025-01-01T12:00:00.000Z');
    const service = new SaveService(fakeStorage, () => fixedDate);
    const state = { scene: 'lab', hp: 100 } as GameState;

    // Act
    service.save(state);

    // Assert
    expect(fakeStorage.setItem).toHaveBeenCalledWith(
      'hawkins-save',
      JSON.stringify({ state, savedAt: fixedDate.toISOString() })
    );
  });
});
```

Ici, deux mocks combinés : `Storage` (frontière I/O) et l'horloge (frontière indéterminisme). Aucun mock du domaine métier : on teste vraiment la collaboration entre `SaveService` et ses dépendances.

#### 🎯 Exercice rapide

**« Identifier ce qu'il faut mocker »** — Pour chaque dépendance ci-dessous, dis si tu mockerais ou pas et pourquoi :
1. `Math.random()` utilisé dans le calcul de coup critique
2. `formatDamageMessage(damage: number)` fonction pure qui renvoie une string
3. `httpClient.post('/save', state)` vers un backend distant
4. `Logger.info(message)` qui écrit dans la console
5. `Date.now()` utilisé pour l'horodatage des saves
6. `calculateDamage(attacker, defender, ability)` appelée depuis `executeAttack`

#### ✅ Correction

1. **`Math.random()`** → Mocker. Indéterminisme. Soit on injecte un `RandomService`, soit on utilise `vi.spyOn(Math, 'random').mockReturnValue(0.5)`.
2. **`formatDamageMessage`** → **Ne pas mocker**. Fonction pure, rapide, déterministe. Aucun critère de mocking. La mocker fragmenterait la confiance.
3. **`httpClient.post`** → Mocker absolument. I/O réseau, lent, instable. Injecter un fake ou utiliser un outil comme MSW.
4. **`Logger.info`** → Mocker uniquement si le test vérifie ce qui est loggué, sinon laisser passer (mais éviter de polluer les sorties de test : `vi.spyOn(console, 'log').mockImplementation(() => {})`).
5. **`Date.now()`** → Mocker. Indéterminisme temporel. Utiliser `vi.useFakeTimers()` ou injecter une fonction clock.
6. **`calculateDamage`** → **Ne pas mocker**. Fonction pure du domaine. Mocker ici dédoublerait la logique métier dans les tests et masquerait les régressions.

#### 🚀 Pistes d'exercices avancés

1. **Mock partiel et `mockReturnValueOnce`** — Mocke `Math.random` uniquement pour le calcul de critique d'une attaque, sans affecter d'autres usages du RNG dans le même test (par exemple un check de fuite de combat). Utilise `mockReturnValueOnce(0.99)` puis `mockReturnValueOnce(0.10)` pour scénariser deux comportements consécutifs.
2. **Mock conditionnel pour retry** — Implémente un fake `HttpClient` qui retourne un succès pour les 3 premiers appels puis échoue au 4ᵉ, pour tester un mécanisme de retry sur la sauvegarde cloud. Vérifie le comportement complet (3 tentatives, succès au 3ᵉ retry) sans dépendre d'un vrai backend.

---

### 2.2 — Différents types de mocks : stub, spy, mock, fake, dummy

#### 📖 Détail

Le mot « mock » est utilisé en pratique comme générique pour désigner tout substitut de dépendance, mais il existe en réalité **cinq types distincts**, popularisés par Gerard Meszaros dans *xUnit Test Patterns* (2007). Connaître ces distinctions évite bien des confusions et permet de choisir le bon outil pour le bon usage.

**1. Le Dummy.** C'est un objet qu'on passe pour respecter la signature mais qui n'est jamais utilisé. Exemple typique : un constructeur exige un `Logger`, mais le test n'exerce pas de chemin qui logue. On passe `null` ou un objet vide casté. Le dummy n'a aucun comportement, aucune assertion ; il existe juste pour satisfaire le compilateur ou l'interface.

**2. Le Stub.** C'est un objet qui retourne des réponses pré-programmées aux appels. Il remplace une dépendance pour fournir des données contrôlées. Exemple : un `UserRepository` stubbé qui renvoie toujours un utilisateur prédéfini. Le stub ne vérifie rien ; il alimente le SUT (System Under Test). En Vitest : `vi.fn().mockReturnValue(...)`.

**3. Le Spy.** C'est un objet qui enregistre les appels qu'il reçoit (arguments, nombre d'appels, ordre) tout en exécutant le vrai code. Il sert à observer sans modifier. Très utile pour vérifier qu'une dépendance a bien été utilisée, sans remplacer son comportement. En Vitest : `vi.spyOn(object, 'method')`.

**4. Le Mock.** C'est un objet qui combine stub + assertions sur les appels reçus. Le test échoue si les attentes pré-déclarées sur les appels ne sont pas remplies. C'est le type le plus « fort » : il vérifie le **contrat d'interaction** entre le SUT et sa dépendance. En Vitest : `vi.fn()` avec `.toHaveBeenCalledWith(...)`.

**5. Le Fake.** C'est une implémentation **alternative et fonctionnelle** de la dépendance, plus simple que la vraie, utilisable dans les tests. Exemple : un `InMemoryUserRepository` qui stocke en RAM au lieu de la base de données. Le fake a une vraie logique métier, mais simplifiée. Très utile pour les tests d'intégration et les démos. À ne pas confondre avec un stub : un fake fonctionne vraiment, un stub renvoie des données statiques.

**Quand utiliser quoi ?**
- **Dummy** : quand une dépendance est requise mais non-exercée par le scénario.
- **Stub** : pour contrôler les entrées venant d'une dépendance (ex. forcer un cas d'erreur, un nombre aléatoire spécifique).
- **Spy** : pour vérifier qu'une dépendance est appelée sans changer son comportement.
- **Mock** : pour vérifier des interactions précises (arguments, nombre, ordre).
- **Fake** : pour des tests d'intégration ou des dépendances complexes (cache, repo, storage).

**Le piège du mock-everywhere.** Beaucoup de développeurs utilisent un mock dès qu'ils ont besoin d'une dépendance, alors qu'un stub ou un fake serait plus approprié. La conséquence : des tests qui vérifient « cette méthode a été appelée avec ces arguments » plutôt que « cette méthode produit le bon résultat ». C'est typiquement du test couplé à l'implémentation (cf. 1.4).

**Conseil pratique** : commencez avec le type le plus faible (dummy ou stub). Si vous avez vraiment besoin de vérifier une interaction, alors utilisez un spy. Le mock à assertions strictes ne se justifie que pour des contrats inter-modules très précis (ex. « le service de paiement doit toujours être appelé exactement une fois avec le montant correct »).

**Syntaxe Vitest récapitulative** :
```typescript
// Stub
const fetchUser = vi.fn().mockReturnValue({ id: 1, name: 'Eleven' });

// Spy (observe sans remplacer)
const calcSpy = vi.spyOn(combat, 'calculate');
combat.attack(eleven, demo);
expect(calcSpy).toHaveBeenCalled();

// Mock avec assertions
const save = vi.fn();
service.persist(data);
expect(save).toHaveBeenCalledWith({ id: 1 });

// Fake (impl. alternative)
class InMemoryStorage implements Storage {
  private data = new Map<string, string>();
  setItem(k: string, v: string) { this.data.set(k, v); }
  getItem(k: string) { return this.data.get(k) ?? null; }
}
```

L'IA a tendance à générer des mocks par défaut, même quand un stub suffit. Habituez-vous à corriger ses propositions : « remplace ce mock par un stub car je n'ai pas besoin de vérifier l'appel ».

#### 🧩 Exemple concret

```typescript
// Système : un service de combat qui sauvegarde après chaque action
import { describe, it, expect, vi } from 'vitest';

class CombatService {
  constructor(
    private logger: Logger,        // dummy (non-exercé ici)
    private rng: RandomService,    // stub (force le hit)
    private save: SaveService,     // spy ou mock (vérification)
    private clock: ClockService,   // stub (date fixe)
  ) {}

  async attack(c: Character, e: Enemy, a: Ability): Promise<void> {
    const isCrit = this.rng.next() > 0.95;
    e.hp -= a.baseDamage * (isCrit ? 2 : 1);
    await this.save.persist({ characterId: c.id, enemyHp: e.hp, at: this.clock.now() });
  }
}

// Test combinant les 4 types de doublure
it('persiste l\'état après une attaque', async () => {
  // Dummy : Logger non-exercé
  const dummyLogger = { log: () => {}, error: () => {} } as unknown as Logger;
  // Stub : RNG déterministe
  const stubRng = { next: vi.fn().mockReturnValue(0.5) } as unknown as RandomService;
  // Mock : SaveService dont on vérifiera l'appel
  const mockPersist = vi.fn().mockResolvedValue(undefined);
  const mockSave = { persist: mockPersist } as unknown as SaveService;
  // Stub : Clock fixe
  const stubClock = { now: () => new Date('2025-01-01') } as ClockService;

  const service = new CombatService(dummyLogger, stubRng, mockSave, stubClock);
  const eleven = makeCharacter({ id: 'eleven-001' });
  const demo = makeEnemy({ hp: 30 });
  const punch = makeAbility({ baseDamage: 5 });

  await service.attack(eleven, demo, punch);

  expect(mockPersist).toHaveBeenCalledWith({
    characterId: 'eleven-001',
    enemyHp: 25,
    at: new Date('2025-01-01'),
  });
});
```

#### 🎯 Exercice rapide

**« Nommer le type de double »** — Pour chaque doublure ci-dessous, identifie son type (dummy / stub / spy / mock / fake) :

```typescript
// A
const noLogger = { info: () => {}, error: () => {} };

// B
const rng = { next: () => 0.42 };

// C
const httpSpy = vi.spyOn(http, 'post');

// D
const save = vi.fn();
// ... appel ...
expect(save).toHaveBeenCalledWith({ id: 1 });

// E
class FakeRepo implements UserRepo {
  private users = new Map<string, User>();
  find(id: string) { return this.users.get(id); }
  add(u: User) { this.users.set(u.id, u); }
}
```

#### ✅ Correction

- **A** : **Dummy** — jamais exercé, n'a aucun comportement utile
- **B** : **Stub** — retourne une valeur fixe (0.42)
- **C** : **Spy** — observe l'appel sans remplacer le comportement
- **D** : **Mock** — vérifie l'interaction (`toHaveBeenCalledWith`)
- **E** : **Fake** — implémentation alternative fonctionnelle (vraie logique en mémoire)

#### 🚀 Pistes d'exercices avancés

1. **Refactoring d'un sur-mocking** — Prends un test où *tout* est mocké (5 dépendances, 8 assertions sur des appels). Refactorise en remplaçant les mocks par des fakes ou des objets réels quand c'est pertinent. Mesure : combien de lignes le test fait-il avant/après ? Combien de mocks restent vraiment nécessaires ?
2. **Bibliothèque de fakes** — Crée un dossier `tests/fakes/` contenant des implémentations en mémoire de toutes les frontières du projet (`InMemoryStorage`, `InMemorySaveRepository`, `FixedClock`, `SeededRandom`). Réécris 5 tests existants en utilisant ces fakes plutôt que des `vi.fn()`. Constate le gain en lisibilité et la baisse du nombre d'assertions sur les appels (moins de couplage à l'implémentation).

---

### 2.3 — Architecture orientée mock, injection de dépendance

#### 📖 Détail

L'**injection de dépendance (DI)** est le pattern architectural qui rend possible le mocking. Sans DI, vos dépendances sont **câblées en dur** dans le code de production (`const storage = new LocalStorage()` directement dans un constructeur), et il est impossible de les remplacer par des doublures dans les tests sans bidouilles fragiles.

Le principe est simple : **une classe ou une fonction ne crée pas ses dépendances elle-même, elle les reçoit**. Cette inversion de responsabilité — l'appelant fournit les dépendances plutôt que l'appelé les fabrique — débloque la testabilité, mais aussi la modularité, l'évolutivité et la réutilisabilité.

**Trois formes principales d'injection** :

1. **Injection par constructeur** (la plus recommandée)
```typescript
class CombatService {
  constructor(
    private rng: RandomService,
    private save: SaveService,
  ) {}
}
```
Avantages : dépendances explicites, immutables, vérifiées à la compilation. C'est la forme par défaut.

2. **Injection par propriété (setter)**
```typescript
class CombatService {
  rng!: RandomService;
  save!: SaveService;
}
```
Avantages : flexibilité (changement à l'exécution). Inconvénients : ouvre la porte à des objets mal initialisés.

3. **Injection par paramètre de méthode**
```typescript
function calculateDamage(c: Character, e: Enemy, a: Ability, rng: () => number) {
  // ...
}
```
Avantages : très local, fonctionnel. Pratique pour des fonctions pures avec une seule dépendance.

Le **pattern d'inversion de dépendance (DIP)** complète la DI. Il stipule qu'une classe doit dépendre d'**abstractions** (interfaces, types), pas d'implémentations concrètes. Au lieu de `private storage: LocalStorage`, on déclare `private storage: Storage` où `Storage` est une interface. Cela permet de substituer librement l'implémentation (LocalStorage en prod, InMemoryStorage en test, IndexedDB plus tard).

**En TypeScript**, la combinaison DI + interfaces est puissante :

```typescript
// Interface (abstraction)
export interface RandomService {
  next(): number; // [0, 1)
  range(min: number, max: number): number;
}

// Implémentation prod
export class MathRandomService implements RandomService {
  next() { return Math.random(); }
  range(min: number, max: number) { return Math.floor(Math.random() * (max - min) + min); }
}

// Implémentation test (fake)
export class SeededRandomService implements RandomService {
  private idx = 0;
  constructor(private values: number[]) {}
  next() { return this.values[this.idx++ % this.values.length]; }
  range(min: number, max: number) { return Math.floor(this.next() * (max - min) + min); }
}
```

Le **wiring** (câblage) — c'est-à-dire l'endroit où on instancie les vraies dépendances et où on les passe — peut se faire à la main (« poor man's DI »), via un container DI (InversifyJS, tsyringe), ou via un framework (NestJS, Angular). Pour un jeu en TypeScript de taille raisonnable, le câblage à la main suffit largement.

**L'anti-pattern « new everywhere »** est l'opposé : chaque classe instancie ses dépendances avec `new`. Conséquence : impossibles à tester sans charger toute la chaîne de dépendances réelles (DB, réseau, fichiers). C'est le symptôme typique du code qu'on dit « non-testable », et c'est presque toujours par cette voie que les projets s'enfoncent dans la dette technique.

**Singletons et globals** sont une autre forme du même problème. Si votre code appelle `Storage.getInstance().setItem(...)`, vous êtes couplé à un singleton qu'il est très difficile de mocker. Préférer toujours l'injection.

**L'IA et l'architecture testable** : Claude Code, à qui on demande de générer une nouvelle fonctionnalité, va souvent par défaut câbler les dépendances en dur. Une pratique payante : ajouter au prompt système (ou au `CLAUDE.md`) une consigne du type « toujours injecter les dépendances par constructeur, jamais d'instanciation interne, et déclarer une interface pour chaque service ». Le résultat sera immédiatement plus testable.

#### 🧩 Exemple concret

```typescript
// ❌ Sans DI — non testable
class CombatService {
  private rng = new MathRandomService();
  private save = new LocalStorageSaveService();

  attack(c: Character, e: Enemy) {
    if (this.rng.next() > 0.95) { /* crit */ }
    this.save.persist({ /* ... */ });
  }
}

// ✅ Avec DI
class CombatService {
  constructor(
    private rng: RandomService,
    private save: SaveService,
  ) {}

  attack(c: Character, e: Enemy) {
    if (this.rng.next() > 0.95) { /* crit */ }
    this.save.persist({ /* ... */ });
  }
}

// Wiring de production (composition root, unique endroit)
const service = new CombatService(
  new MathRandomService(),
  new LocalStorageSaveService(),
);

// Wiring de test
const testService = new CombatService(
  new SeededRandomService([0.99]), // garantit un crit
  { persist: vi.fn() } as unknown as SaveService,
);
```

#### 🎯 Exercice rapide

**« Refactorer pour la DI »** — Voici une classe `Game` non-testable. Refactorise-la pour qu'elle accepte ses dépendances en constructeur, en t'appuyant sur des interfaces :

```typescript
class Game {
  private save = new LocalStorageSaveService();
  private clock = new SystemClock();

  saveSnapshot(state: GameState) {
    const ts = this.clock.now().toISOString();
    this.save.persist({ ...state, ts });
  }
}
```

#### ✅ Correction

```typescript
// Abstractions
interface SaveService {
  persist(data: unknown): void;
}

interface Clock {
  now(): Date;
}

// Classe testable
class Game {
  constructor(
    private save: SaveService,
    private clock: Clock,
  ) {}

  saveSnapshot(state: GameState) {
    const ts = this.clock.now().toISOString();
    this.save.persist({ ...state, ts });
  }
}

// Test
it('persiste l\'état avec un horodatage', () => {
  // Arrange
  const spyPersist = vi.fn();
  const game = new Game(
    { persist: spyPersist },
    { now: () => new Date('2025-01-01') },
  );

  // Act
  game.saveSnapshot({ scene: 'lab' } as GameState);

  // Assert
  expect(spyPersist).toHaveBeenCalledWith({
    scene: 'lab',
    ts: '2025-01-01T00:00:00.000Z',
  });
});

// Wiring de production
const game = new Game(
  new LocalStorageSaveService(),
  new SystemClock(),
);
```

#### 🚀 Pistes d'exercices avancés

1. **Container DI maison** — Implémente un mini-container DI en 50 lignes de TypeScript (`container.register('save', () => new LocalSave())`, `container.resolve<SaveService>('save')`). Branche-le sur Hawkins Lab Escape et compare avec une instanciation manuelle. Mesure : la lisibilité du wiring s'améliore-t-elle ? Y a-t-il de nouveaux problèmes (cycles de dépendances, lifetime management) ?
2. **Composition root unique** — Refactorise Hawkins Lab Escape pour qu'il n'y ait **qu'un seul endroit** dans tout le code où on appelle `new` sur des services. Tout le reste reçoit ses dépendances par constructeur. Mesure l'impact : combien de classes ont vu leur signature changer ? Combien sont devenues testables ?

---

# 🌆 APRÈS-MIDI

---

## Module 3 — TDD, BDD et tests d'intégration complets

### 3.1 — Introduction au TDD et la boucle Red-Green-Refactor

#### 📖 Détail

Le **Test Driven Development (TDD)**, popularisé par Kent Beck dans *Test-Driven Development by Example* (2002), est une méthodologie de développement où **on écrit le test avant le code de production**. Cette inversion paraît contre-intuitive (« comment tester ce qui n'existe pas ? ») et bouscule les habitudes, mais elle produit des effets profonds sur la qualité du code, sur la conception et sur la confiance des développeurs.

La discipline TDD se résume en une **boucle de trois étapes** qu'on appelle **Red-Green-Refactor**, à répéter inlassablement pour chaque petit incrément de fonctionnalité.

**Rouge (Red)** : on écrit un test qui décrit le comportement souhaité. Comme le code n'existe pas encore (ou ne couvre pas ce cas), le test échoue. Le rouge est essentiel : il prouve que le test fonctionne (un test qui passe avant l'écriture du code est suspect — il ne teste probablement rien). Cette étape force à réfléchir à l'API avant l'implémentation : quel est le nom de la fonction ? Quels sont ses paramètres ? Que retourne-t-elle ?

**Vert (Green)** : on écrit **le code minimal** qui fait passer le test. Pas plus, pas moins. C'est l'étape la plus contre-intuitive : on doit résister à la tentation d'écrire le code « propre » ou « complet » dès le premier jet. Si le test attend que `calculateDamage(0, 0)` retourne `1`, on peut littéralement écrire `return 1`. Cette discipline radicale, qu'on appelle parfois « simuler l'incompétence », force à écrire un deuxième test qui invalidera la solution triviale, et ainsi de suite, jusqu'à émerger d'un design progressivement.

**Refactor** : une fois le test au vert, on **améliore le code** sans changer son comportement. Renommer, extraire des fonctions, éliminer la duplication, clarifier les noms. Le test reste vert tout du long — c'est lui qui garantit qu'on ne casse rien. C'est l'étape la plus négligée et pourtant la plus précieuse : sans elle, on accumule du code médiocre.

**Les trois lois du TDD** (Uncle Bob) :
1. N'écris pas de code de production sauf pour faire passer un test qui échoue
2. N'écris pas plus de test que nécessaire pour le faire échouer (compilation incluse)
3. N'écris pas plus de code de production que nécessaire pour faire passer le test

Ces lois sont volontairement extrêmes pour habituer le débutant. Avec l'expérience, on assouplit, mais on garde la philosophie : **petits incréments, feedback constant**.

**Les bénéfices du TDD** :
- **Conception émergente** : on conçoit l'API depuis le point de vue de l'appelant, ce qui produit des interfaces naturelles à utiliser.
- **Couverture par construction** : chaque ligne de code est née d'un test, donc 100 % de couverture sans effort.
- **Documentation vivante** : les tests décrivent les comportements attendus, ils servent de spec.
- **Confiance pour refactorer** : on peut tout réécrire à condition de garder les tests verts.
- **Détection précoce des dépendances** : si on n'arrive pas à tester, on s'en rend compte tout de suite, pas dans 3 semaines.

**Les pièges du TDD** :
- **L'écriture du « bon » test** : un test trop couplé à l'implémentation va guider vers un mauvais design. Toujours penser comportement (cf. 1.4).
- **L'incrément trop grand** : si on essaie de tester une feature complète d'un coup, on retombe dans le développement classique. Avancer par micro-pas.
- **Sauter le refactor** : tentant de passer au test suivant dès que le green est atteint. Le code se dégrade vite.
- **TDD partout, tout le temps** : le TDD shine sur la logique métier complexe. Sur un script jetable ou une exploration, c'est de la surcharge.

**TDD assisté par IA** : la combinaison est très puissante. Workflow type :
1. Tu écris un test (Red).
2. Tu demandes à Claude Code : « implémente le code minimal qui fait passer ce test ».
3. Tu lances les tests (Green).
4. Tu demandes : « refactorise ce code sans casser les tests, en extrayant les responsabilités ».
5. Tu lances les tests pour vérifier que tout reste vert.

Cette boucle change tout : tu restes le pilote (tu définis le quoi via les tests), l'IA accélère le comment.

#### 🧩 Exemple concret — Implémentation TDD d'un `LevelUpService`

**Cycle 1 — Red**
```typescript
it('passe le personnage au niveau 2 quand son XP atteint le seuil de 100', () => {
  const eleven = makeCharacter({ level: 1, xp: 100 });
  const service = new LevelUpService();

  service.checkAndApply(eleven);

  expect(eleven.level).toBe(2);
});
```

**Cycle 1 — Green (minimum)**
```typescript
class LevelUpService {
  checkAndApply(c: Character) {
    c.level = 2;
  }
}
```

Le test passe, mais c'est trivial. Ajoutons un test qui force à généraliser.

**Cycle 2 — Red**
```typescript
it('ne fait pas monter le personnage en niveau quand son XP est insuffisant', () => {
  const eleven = makeCharacter({ level: 1, xp: 50 });
  const service = new LevelUpService();

  service.checkAndApply(eleven);

  expect(eleven.level).toBe(1);
});
```

**Cycle 2 — Green**
```typescript
class LevelUpService {
  checkAndApply(c: Character) {
    if (c.xp >= 100) c.level += 1;
  }
}
```

**Cycle 3 — Red (généralisation)**
```typescript
it('passe directement au niveau 3 si l\'XP atteint 200', () => {
  const eleven = makeCharacter({ level: 1, xp: 200 });
  const service = new LevelUpService();

  service.checkAndApply(eleven);

  expect(eleven.level).toBe(3);
});
```

**Cycle 3 — Green + Refactor**
```typescript
const XP_PER_LEVEL = 100;

class LevelUpService {
  checkAndApply(c: Character) {
    const targetLevel = Math.floor(c.xp / XP_PER_LEVEL) + 1;
    if (targetLevel > c.level) c.level = targetLevel;
  }
}
```

Les trois tests restent verts. Le code a émergé : il n'y a pas eu de « grand design ».

#### 🎯 Exercice rapide

**« TDD d'un système de potion »** — En suivant strictement le Red-Green-Refactor, implémente une fonction `applyPotion(character, potion)` qui :
- Soigne le personnage selon `potion.power`
- Ne dépasse jamais `maxHp`
- Lève une exception si la potion n'est pas du type 'consumable'

Écris au moins 3 cycles complets en montrant chaque étape.

#### ✅ Correction

**Cycle 1 — Red**
```typescript
it('soigne le personnage de la puissance de la potion', () => {
  const eleven = makeCharacter({ hp: 5, maxHp: 20 });
  const potion = makeItem({ type: 'consumable', power: 10 });

  applyPotion(eleven, potion);

  expect(eleven.stats.hp).toBe(15);
});
```

**Cycle 1 — Green**
```typescript
export function applyPotion(c: Character, p: Item) {
  c.stats.hp += p.power!;
}
```

**Cycle 2 — Red**
```typescript
it('plafonne les PV au maximum autorisé', () => {
  const eleven = makeCharacter({ hp: 18, maxHp: 20 });
  const potion = makeItem({ type: 'consumable', power: 10 });

  applyPotion(eleven, potion);

  expect(eleven.stats.hp).toBe(20);
});
```

**Cycle 2 — Green**
```typescript
export function applyPotion(c: Character, p: Item) {
  c.stats.hp = Math.min(c.stats.maxHp, c.stats.hp + p.power!);
}
```

**Cycle 3 — Red**
```typescript
it('lève une exception si l\'item n\'est pas consommable', () => {
  const eleven = makeCharacter({ hp: 5, maxHp: 20 });
  const sword = makeItem({ type: 'weapon', power: 10 });

  expect(() => applyPotion(eleven, sword)).toThrow('Not a consumable');
});
```

**Cycle 3 — Green + Refactor**
```typescript
export function applyPotion(c: Character, p: Item) {
  if (p.type !== 'consumable') throw new Error('Not a consumable');
  c.stats.hp = Math.min(c.stats.maxHp, c.stats.hp + (p.power ?? 0));
}
```

#### 🚀 Pistes d'exercices avancés

1. **TDD d'un système de combat tour par tour** — Implémente en TDD une `CombatRound` qui prend un attaquant, un défenseur et une action, calcule les dégâts, applique les effets, et retourne l'état mis à jour. Vise au moins 10 cycles RGR, et garde un journal des refactorings émergents : la forme du code à la fin doit être différente de ce que tu aurais écrit d'un seul jet sans TDD.
2. **TDD assisté par Claude Code** — Fais le même exercice mais en mode pair-programming : tu écris les tests, Claude Code écrit le green, vous refactorisez ensemble. Note les différences : Claude propose-t-il des refactorings auxquels tu n'aurais pas pensé ? Le code final est-il meilleur, équivalent, ou moins bon que celui que tu aurais produit seul ?

---

### 3.2 — Introduction au BDD

#### 📖 Détail

Le **Behavior Driven Development (BDD)**, introduit par Dan North vers 2006, est une évolution naturelle du TDD qui adresse un de ses points faibles : le **fossé entre développeurs et parties prenantes**. Là où les tests TDD parlent en code aux développeurs, les scénarios BDD parlent en langage naturel à tout le monde — product owner, designer, client, testeur, développeur. Ils deviennent un **contrat commun**, une spécification exécutable que personne n'a besoin de traduire.

Le BDD ne remplace pas le TDD : ils opèrent à des niveaux différents. Le TDD pilote la conception **technique** (« quelle est la bonne API pour cette fonction ? »). Le BDD pilote la conception **métier** (« quel comportement attendons-nous du système pour ce cas d'usage ? »). Sur un projet sain, on utilise les deux : BDD au niveau des features (souvent au niveau intégration), TDD au niveau du code interne.

**Le pattern fondamental** du BDD est **Given-When-Then** :
- **Given** : le contexte initial (l'état du système avant l'action)
- **When** : l'événement déclencheur (l'action de l'utilisateur ou du système)
- **Then** : le résultat attendu (l'état observable après l'action)

Ce pattern n'est pas une nouveauté — c'est exactement Arrange-Act-Assert renommé. La différence est culturelle : on écrit les scénarios **avec** les parties prenantes non-techniques, en langage métier, **avant** de penser au code.

**Le format Gherkin** est la syntaxe standard pour exprimer ces scénarios. Un fichier `.feature` ressemble à ceci :

```gherkin
Feature: Sauvegarde de la progression
  En tant que joueur de Hawkins Lab Escape
  Je veux pouvoir sauvegarder ma partie
  Afin de reprendre plus tard

  Scenario: Sauvegarde manuelle réussie
    Given je joue à Hawkins Lab Escape
    And mon personnage Eleven a 75 PV
    And je me trouve dans la scène "lab"
    When je sauvegarde la partie
    Then la sauvegarde existe avec mon état actuel
    And je peux la recharger plus tard
```

Plusieurs constats : **aucun jargon technique**, **vocabulaire métier** (« Eleven », « PV », « scène »), **étapes courtes et univoques**. C'est lisible par un product owner.

**Les trois amigos** est la pratique recommandée pour produire ces scénarios : un product owner, un développeur et un testeur s'asseyent ensemble pour écrire les scénarios d'une feature avant le développement. Cette conversation à trois est souvent plus utile que le scénario lui-même : elle révèle les ambiguïtés, les cas oubliés, les contradictions.

**Les étapes Gherkin** se traduisent en code via des **step definitions** — des fonctions TypeScript (ou autre langage) liées par regex aux phrases naturelles. Cucumber.js et @cucumber/cucumber sont les outils dominants en TS.

```typescript
import { Given, When, Then } from '@cucumber/cucumber';

Given('je joue à Hawkins Lab Escape', function () {
  this.game = new Game();
});

Given('mon personnage Eleven a {int} PV', function (hp: number) {
  this.game.player = makeCharacter({ name: 'Eleven', hp });
});

When('je sauvegarde la partie', function () {
  this.result = this.game.save();
});

Then('la sauvegarde existe avec mon état actuel', function () {
  expect(this.result.state.player.stats.hp).toBe(this.game.player.stats.hp);
});
```

**Avantages du BDD** :
- **Lisibilité universelle** : tout le monde dans l'équipe peut lire les scénarios
- **Spécification exécutable** : la documentation ne peut pas mentir, elle est vérifiée par la machine
- **Découverte des cas oubliés** : la conversation des trois amigos est très productive
- **Réutilisation** : les étapes (`Given mon personnage a {int} PV`) sont mutualisées entre scénarios

**Inconvénients et pièges** :
- **Overhead** : pour un simple calcul, écrire un `.feature` est disproportionné
- **Tendance au "scenario inflation"** : un `.feature` qui grossit jusqu'à 200 scénarios devient illisible
- **Couplage UI** : on est tenté d'écrire des étapes du type « When je clique sur le bouton bleu » — c'est mauvais, on perd l'aspect métier
- **Maintenance des step definitions** : refactorer la regex d'une étape impacte tous les scénarios qui l'utilisent

**Règle d'or** : utilisez le BDD pour les **comportements métier exprimables en langage naturel par un non-développeur**. Pour le reste, les tests unitaires en code suffisent.

**Couplage BDD + IA** : Claude Code excelle à transformer une user story en scénarios Gherkin. Le prompt type : « Voici une user story de Hawkins Lab Escape. Génère 3 scénarios Gherkin couvrant le cas nominal, un cas d'erreur, et un cas limite. Garde un vocabulaire métier, pas d'UI. » Le résultat est souvent excellent et peut être affiné en quelques itérations.

#### 🧩 Exemple concret

```gherkin
# tests/bdd/features/inventory.feature
Feature: Gestion de l'inventaire

  Scenario: Ramasser un objet
    Given Eleven a un inventaire vide
    When elle ramasse une "Eggos Box"
    Then son inventaire contient 1 objet
    And l'objet ramassé est "Eggos Box"

  Scenario: Inventaire plein
    Given Eleven a un inventaire contenant 10 objets
    When elle tente de ramasser une "Eggos Box"
    Then l'action est refusée avec le message "Inventaire plein"
    And son inventaire contient toujours 10 objets
```

```typescript
// tests/bdd/steps/inventory.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { Inventory } from '../../../src/domain/inventory';
import { makeItem } from '../../helpers/factories';

Given('Eleven a un inventaire vide', function () {
  this.inventory = new Inventory([]);
});

Given('Eleven a un inventaire contenant {int} objets', function (n: number) {
  const items = Array.from({ length: n }, (_, i) => makeItem({ id: `item-${i}` }));
  this.inventory = new Inventory(items);
});

When('elle ramasse une {string}', function (itemName: string) {
  this.lastAction = this.inventory.add(makeItem({ name: itemName }));
});

When('elle tente de ramasser une {string}', function (itemName: string) {
  this.lastAction = this.inventory.add(makeItem({ name: itemName }));
});

Then('son inventaire contient {int} objet(s)', function (n: number) {
  expect(this.inventory.size()).to.equal(n);
});

Then('l\'objet ramassé est {string}', function (name: string) {
  expect(this.inventory.items.at(-1)?.name).to.equal(name);
});

Then('l\'action est refusée avec le message {string}', function (msg: string) {
  expect(this.lastAction.success).to.be.false;
  expect(this.lastAction.reason).to.equal(msg);
});

Then('son inventaire contient toujours {int} objets', function (n: number) {
  expect(this.inventory.size()).to.equal(n);
});
```

#### 🎯 Exercice rapide

**« De la user story au scénario BDD »** — Voici une user story. Rédige 2 scénarios Gherkin :

> En tant que joueur de Hawkins Lab Escape, je veux utiliser une potion depuis mon inventaire afin de me soigner pendant un combat.

#### ✅ Correction

```gherkin
Feature: Utiliser une potion en combat

  Scenario: Soin réussi en combat
    Given Eleven est en combat avec 30 PV (max 100)
    And son inventaire contient une "Potion de soin" de puissance 40
    When elle utilise la "Potion de soin"
    Then ses PV passent à 70
    And la "Potion de soin" est retirée de son inventaire

  Scenario: Soin plafonné au maximum
    Given Eleven est en combat avec 90 PV (max 100)
    And son inventaire contient une "Potion de soin" de puissance 40
    When elle utilise la "Potion de soin"
    Then ses PV sont plafonnés à 100
    And la "Potion de soin" est retirée de son inventaire
```

#### 🚀 Pistes d'exercices avancés

1. **Scénarios d'erreur exhaustifs** — Pour la même user story, écris 5 scénarios couvrant : combat terminé, personnage déjà au max, inventaire vide, potion expirée (effet temporel), interruption par un ennemi qui agit en même temps. Discute lesquels relèvent du BDD vs du unit test (certains cas internes ne méritent pas un scénario Gherkin).
2. **Refonte d'un `.feature` trop UI** — Voici une étape Gherkin couplée à l'UI : « When je clique sur le bouton "Potion" dans le menu d'inventaire ». Refonds-la pour la rendre métier. Quelle étape de step definition cela impacte ? Quel impact sur la testabilité multi-plateforme (web/mobile) ?

---

### 3.3 — Démo BDD en TypeScript et tests d'intégration

#### 📖 Détail

Cette session synthétise les apprentissages du module 3 en construisant une **mini-feature complète en BDD** sur Hawkins Lab Escape, et introduit la notion de **tests d'intégration** — qui se trouvent souvent à la frontière entre unitaire et E2E.

**Différence unit / intégration / E2E** :
- **Unit** : une fonction ou classe en isolation, dépendances mockées
- **Intégration** : plusieurs composants collaborent, certaines dépendances réelles (DB locale, in-memory storage, vrai fichier .feature)
- **E2E** : la stack complète, UI incluse, état persistant réel

Les tests d'intégration sont **le ventre mou** de la plupart des projets : ni testés unitairement (« c'est de l'orchestration »), ni couverts en E2E (« trop lent »). Ils sont pourtant cruciaux pour valider les interactions entre modules, les contrats d'API internes, et les flux de données. Le BDD vit naturellement à ce niveau-là, car les scénarios métier impliquent généralement plusieurs unités collaborant.

**Quand écrire un test d'intégration ?**
- Quand deux ou plusieurs modules collaborent et que leur contrat est crucial
- Quand on utilise une bibliothèque externe complexe (ORM, parseur, runtime)
- Quand on veut valider la configuration (routes, DI container, schémas DB)
- Quand un bug a déjà touché l'orchestration sans être détecté par les unitaires

**Configuration BDD pour Hawkins Lab Escape** :

```json
// package.json (extrait)
{
  "scripts": {
    "test": "vitest run",
    "test:bdd": "cucumber-js"
  },
  "devDependencies": {
    "@cucumber/cucumber": "^11.0.0",
    "chai": "^4.5.0",
    "ts-node": "^10.9.0",
    "vitest": "^2.0.0"
  }
}
```

```javascript
// cucumber.cjs
module.exports = {
  default: {
    requireModule: ['ts-node/register'],
    require: [
      'tests/bdd/steps/**/*.ts',
      'tests/bdd/support/**/*.ts',
    ],
    paths: ['tests/bdd/features/**/*.feature'],
    format: [
      'progress-bar',
      'html:reports/cucumber.html',
    ],
  },
};
```

**Le World** (ou contexte de test) : Cucumber.js permet d'injecter un objet `this` partagé entre étapes du même scénario. C'est l'endroit idéal pour stocker l'état du jeu pendant le scénario.

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
}

setWorldConstructor(HawkinsWorld);
```

**Hooks** : `Before`/`After` permettent d'initialiser et nettoyer entre scénarios :

```typescript
// tests/bdd/support/hooks.ts
import { Before, After } from '@cucumber/cucumber';
import { HawkinsWorld } from './world';

Before(function (this: HawkinsWorld) {
  this.game = new Game(/* deps */);
  this.lastResult = undefined;
});

After(function (this: HawkinsWorld, scenario) {
  if (scenario.result?.status === 'FAILED') {
    console.log(`Scénario échoué : ${scenario.pickle.name}`);
  }
});
```

**Tags** pour filtrer les scénarios :
```gherkin
@combat @slow
Scenario: Combat épique
  Given ...
```
Lancement : `cucumber-js --tags "@combat and not @slow"`.

**Anti-patterns BDD classiques** :
- **Scénarios à rallonge** : plus de 10 étapes → c'est trop, il y a probablement deux comportements mélangés
- **Étapes mutables** : un Then qui modifie l'état → ce n'est plus une assertion
- **Réutilisation de l'état entre scénarios** : chaque scénario doit être indépendant
- **Mock dans les steps** : si vous mockez fortement dans Cucumber, vous écrivez en réalité des unit tests avec un overhead Gherkin — gardez les unit tests pour ça

**Intégration TDD + BDD : outside-in development** — le workflow recommandé. On part d'un scénario Gherkin (BDD, niveau feature), qui échoue. On descend ensuite dans le code et on développe en TDD les briques nécessaires pour faire passer le scénario. Une fois toutes les briques en vert, on remonte au scénario Gherkin qui passe à son tour. C'est un mariage très puissant qui aligne le métier et la technique.

#### 🧩 Exemple concret — feature complète "Combat"

```gherkin
# tests/bdd/features/combat.feature
Feature: Combattre un Demogorgon

  Background:
    Given Eleven a 100 PV et 50 énergie psychique
    And un Demogorgon a 80 PV

  Scenario: Attaque psychique réussie
    When Eleven utilise "Psychic Blast" sur le Demogorgon
    Then le Demogorgon a 50 PV
    And Eleven a 35 énergie psychique restante

  Scenario: Énergie insuffisante
    Given Eleven n'a plus que 5 énergie psychique
    When Eleven tente d'utiliser "Psychic Blast" sur le Demogorgon
    Then l'action est refusée pour "Énergie insuffisante"
    And le Demogorgon a toujours 80 PV
```

```typescript
// tests/bdd/steps/combat.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { HawkinsWorld } from '../support/world';
import { Combat } from '../../../src/domain/combat';
import { makeCharacter, makeEnemy, makeAbility } from '../../helpers/factories';

Given('Eleven a {int} PV et {int} énergie psychique', function (this: HawkinsWorld, hp: number, energy: number) {
  this.player = makeCharacter({ name: 'Eleven', hp, energy, maxHp: 100, maxEnergy: 50 });
  this.player.abilities = [makeAbility({ name: 'Psychic Blast', baseDamage: 30, energyCost: 15 })];
});

Given('un Demogorgon a {int} PV', function (this: HawkinsWorld, hp: number) {
  this.enemy = makeEnemy({ name: 'Demogorgon', hp, defense: 0 });
});

Given('Eleven n\'a plus que {int} énergie psychique', function (this: HawkinsWorld, energy: number) {
  this.player.stats.energy = energy;
});

When('Eleven utilise {string} sur le Demogorgon', function (this: HawkinsWorld, abilityName: string) {
  const ability = this.player.abilities.find(a => a.name === abilityName)!;
  this.lastResult = new Combat().execute(this.player, this.enemy!, ability);
});

When('Eleven tente d\'utiliser {string} sur le Demogorgon', function (this: HawkinsWorld, abilityName: string) {
  const ability = this.player.abilities.find(a => a.name === abilityName)!;
  this.lastResult = new Combat().execute(this.player, this.enemy!, ability);
});

Then('le Demogorgon a {int} PV', function (this: HawkinsWorld, hp: number) {
  expect(this.enemy!.hp).to.equal(hp);
});

Then('Eleven a {int} énergie psychique restante', function (this: HawkinsWorld, energy: number) {
  expect(this.player.stats.energy).to.equal(energy);
});

Then('l\'action est refusée pour {string}', function (this: HawkinsWorld, reason: string) {
  expect(this.lastResult?.success).to.be.false;
  expect(this.lastResult?.reason).to.equal(reason);
});

Then('le Demogorgon a toujours {int} PV', function (this: HawkinsWorld, hp: number) {
  expect(this.enemy!.hp).to.equal(hp);
});
```

**Exécution** : `npm run test:bdd` lance Cucumber, parse les `.feature`, mappe sur les step definitions, et exécute. Sortie attendue : 2 scenarios, 9 steps, all passing.

#### 🎯 Exercice rapide

**« Écrire un test d'intégration pour le SaveService »** — Le `SaveService` utilise un `Storage` (interface). Écris un test d'intégration qui utilise un vrai `InMemoryStorage` (fake, pas un mock), et vérifie qu'on peut faire save puis load et récupérer le même état.

#### ✅ Correction

```typescript
// src/services/in-memory.storage.ts
import type { Storage } from './save.service';

export class InMemoryStorage implements Storage {
  private data = new Map<string, string>();
  setItem(key: string, value: string) { this.data.set(key, value); }
  getItem(key: string): string | null { return this.data.get(key) ?? null; }
}

// tests/integration/save-service.integration.test.ts
import { describe, it, expect } from 'vitest';
import { SaveService } from '../../src/services/save.service';
import { InMemoryStorage } from '../../src/services/in-memory.storage';

describe('SaveService (intégration avec InMemoryStorage)', () => {
  it('permet de sauvegarder puis recharger le même état', () => {
    // Arrange
    const storage = new InMemoryStorage();
    const service = new SaveService(storage, () => new Date('2025-01-01'));
    const state = { scene: 'lab', player: { hp: 75 } };

    // Act
    service.save(state);
    const loaded = service.load();

    // Assert
    expect(loaded?.state).toEqual(state);
  });

  it('renvoie null quand aucune sauvegarde n\'existe', () => {
    const storage = new InMemoryStorage();
    const service = new SaveService(storage, () => new Date());

    expect(service.load()).toBeNull();
  });
});
```

Ce test valide la **collaboration** entre `SaveService` et `InMemoryStorage` (sérialisation, désérialisation, gestion de l'absence). Aucun mock : c'est un vrai test d'intégration qui aurait détecté un bug de sérialisation qu'un test unitaire mocké aurait raté.

#### 🚀 Pistes d'exercices avancés

1. **Scenario Outline pour la table de calcul de dégâts** — Utilise la syntaxe `Scenario Outline` + `Examples` de Gherkin pour tester 8 combinaisons d'attaque/défense en un seul scénario paramétré. Compare lisibilité, debuggabilité et temps d'exécution par rapport à 8 scénarios distincts.
2. **Outside-in development de bout en bout** — Pars d'un nouveau scénario : « Lancer un sort de poussée qui repousse l'ennemi d'une case ». Implémente-le en outside-in : commence par le scénario Gherkin qui échoue, descends en TDD pour créer les briques manquantes (`PushEffect`, `applyKnockback`, `Grid.move`), remonte. Documente le chemin : combien de cycles RGR unitaires ? Combien d'allers-retours entre BDD et TDD ?

---

# 📚 Synthèse de la journée

À l'issue de cette première journée, les stagiaires repartent avec une boîte à outils complète :

- **Module 1** : ils savent ce qu'est un bon test et pourquoi écrire des tests change tout — d'autant plus dans un contexte de développement assisté par IA
- **Module 2** : ils savent mocker les frontières sans surmocker le cœur, et concevoir leur architecture pour qu'elle soit testable (DI, interfaces)
- **Module 3** : ils savent piloter le code par les tests (TDD) et par les comportements métier (BDD), et combiner les deux dans un workflow outside-in

Le projet **Hawkins Lab Escape** sert de fil rouge concret et permettra, lors de la journée 2, d'aller plus loin sur :
- la génération de tests avec l'IA (Claude Code, Cursor) et l'identification des erreurs produites
- la rédaction de scénarios Gherkin avancés
- les tests end-to-end avec Playwright
- la mise en cohérence d'une stratégie de tests à plusieurs niveaux
