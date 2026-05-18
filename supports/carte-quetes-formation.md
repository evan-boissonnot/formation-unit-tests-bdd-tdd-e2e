# 🗺️ Carte des Quêtes — Formation Tests Unitaires

> Progression sur 2 jours dans l'univers Hawkins Lab Escape

---

## Vue d'ensemble (parcours complet)

```mermaid
flowchart TD
    START(["🎮 Start<br/>Hawkins Lab Escape"]):::start

    %% === ACTE I : JOUR 1 ===
    START --> ACT1{{"🌅 ACTE I — JOUR 1<br/>Les Fondations"}}:::act

    ACT1 --> Q1(["⚔️ Quête I<br/>Introduction au Testing"]):::mainquest
    Q1 --> Q1A(("Pourquoi tester ?")):::sub
    Q1 --> Q1B(("Anatomie<br/>d'un bon test")):::sub
    Q1 --> Q1C(("AAA<br/>Arrange Act Assert")):::sub
    Q1 --> Q1D(("Comportement<br/>vs implémentation")):::sub

    Q1 --> Q2(["🛡️ Quête II<br/>Mock & Architecture"]):::mainquest
    Q2 --> Q2A(("Pourquoi<br/>mocker ?")):::sub
    Q2 --> Q2B(("Types de doubles<br/>stub spy mock fake")):::sub
    Q2 --> Q2C(("Injection<br/>de dépendance")):::sub

    Q2 --> BOSS1{{"⚡ Boss du J1<br/>TDD & BDD"}}:::boss
    BOSS1 --> Q3A(("Red-Green<br/>Refactor")):::sub
    BOSS1 --> Q3B(("Intro BDD<br/>Gherkin")):::sub
    BOSS1 --> Q3C(("Démo Cucumber.js<br/>+ intégration")):::sub

    BOSS1 --> CHECK1[["💾 Checkpoint J1<br/>Premiers tests<br/>sur Hawkins"]]:::checkpoint

    %% === ACTE II : JOUR 2 ===
    CHECK1 --> ACT2{{"🌆 ACTE II — JOUR 2<br/>Approfondissement"}}:::act

    ACT2 --> Q4(["🧪 Quête IV<br/>Mocking Avancé"]):::mainquest
    Q4 --> Q4A(("Fake timers<br/>contrôle du temps")):::sub
    Q4 --> Q4B(("MSW<br/>Mock Service Worker")):::sub
    Q4 --> Q4C(("Fixtures<br/>& builders fluents")):::sub

    Q4 --> Q5(["🎲 Quête V<br/>Property-based Testing"]):::mainquest
    Q5 --> Q5A(("fast-check<br/>premiers pas")):::sub
    Q5 --> Q5B(("Génération<br/>& shrinking")):::sub

    Q5 --> Q6(["📜 Quête VI<br/>BDD Avancé"]):::mainquest
    Q6 --> Q6A(("User story<br/>vers Gherkin")):::sub
    Q6 --> Q6B(("Cucumber.js + TS<br/>en profondeur")):::sub

    Q6 --> Q7(["🌐 Quête VII<br/>E2E Playwright"]):::mainquest
    Q7 --> Q7A(("Setup<br/>multi-navigateurs")):::sub
    Q7 --> Q7B(("Page Object Model<br/>& fiabilisation")):::sub

    Q7 --> BOSS2{{"👑 Boss final<br/>Stratégie & Qualité"}}:::boss
    BOSS2 --> Q8A(("Couverture<br/>+ Mutation Testing")):::sub
    BOSS2 --> Q8B(("Pyramide<br/>& CI/CD stratifiée")):::sub
    BOSS2 --> Q8C(("Projet fil rouge<br/>SaveSlot complet")):::sub

    BOSS2 --> END(["🏆 Victoire<br/>Maîtrise complète"]):::end

    %% Styles
    classDef start fill:#1a1a2e,stroke:#e94560,stroke-width:3px,color:#fff
    classDef act fill:#0f3460,stroke:#e94560,stroke-width:2px,color:#fff
    classDef mainquest fill:#16213e,stroke:#ffd60a,stroke-width:2px,color:#ffd60a
    classDef boss fill:#5d0e41,stroke:#ff006e,stroke-width:3px,color:#fff
    classDef sub fill:#1e293b,stroke:#06b6d4,stroke-width:1px,color:#a5f3fc
    classDef checkpoint fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#6ee7b7
    classDef end fill:#7c2d12,stroke:#fbbf24,stroke-width:3px,color:#fff
```

---

## Détail Acte I — Journée 1

```mermaid
flowchart LR
    J1(["🌅 JOUR 1<br/>Les Fondations"]):::day

    J1 --> M1(["⚔️ Module 1<br/>Introduction"]):::module
    M1 --> M1_1(("1.1 Pourquoi tester")):::obj
    M1 --> M1_2(("1.2 Bon test")):::obj
    M1 --> M1_3(("1.3 AAA")):::obj
    M1 --> M1_4(("1.4 Comportement")):::obj

    J1 --> M2(["🛡️ Module 2<br/>Mock & DI"]):::module
    M2 --> M2_1(("2.1 Besoin de mock")):::obj
    M2 --> M2_2(("2.2 Types doubles")):::obj
    M2 --> M2_3(("2.3 Injection deps")):::obj

    J1 --> M3(["⚡ Module 3<br/>TDD + BDD"]):::module
    M3 --> M3_1(("3.1 Red-Green-Refactor")):::obj
    M3 --> M3_2(("3.2 Intro BDD")):::obj
    M3 --> M3_3(("3.3 Cucumber.js")):::obj

    classDef day fill:#0f3460,stroke:#e94560,stroke-width:3px,color:#fff
    classDef module fill:#16213e,stroke:#ffd60a,stroke-width:2px,color:#ffd60a
    classDef obj fill:#1e293b,stroke:#06b6d4,color:#a5f3fc
```

---

## Détail Acte II — Journée 2

```mermaid
flowchart LR
    J2(["🌆 JOUR 2<br/>Approfondissement"]):::day

    J2 --> M4(["🧪 Module 4<br/>Mocking Avancé"]):::module
    M4 --> M4_1(("4.1 Fake timers")):::obj
    M4 --> M4_2(("4.2 MSW réseau")):::obj
    M4 --> M4_3(("4.3 Builders")):::obj

    J2 --> M5(["🎲 Module 5<br/>Property-based"]):::module
    M5 --> M5_1(("5.1 fast-check")):::obj
    M5 --> M5_2(("5.2 Shrinking")):::obj

    J2 --> M6(["📜 Module 6<br/>BDD Avancé"]):::module
    M6 --> M6_1(("6.1 User story → Gherkin")):::obj
    M6 --> M6_2(("6.2 Cucumber.js + TS")):::obj

    J2 --> M7(["🌐 Module 7<br/>E2E Playwright"]):::module
    M7 --> M7_1(("7.1 Setup multi-browsers")):::obj
    M7 --> M7_2(("7.2 Page Object Model")):::obj

    J2 --> M8(["👑 Module 8<br/>Stratégie & Qualité"]):::module
    M8 --> M8_1(("8.1 Stryker mutation")):::obj
    M8 --> M8_2(("8.2 Pyramide & CI")):::obj
    M8 --> M8_3(("8.3 Projet synthèse")):::obj

    classDef day fill:#0f3460,stroke:#e94560,stroke-width:3px,color:#fff
    classDef module fill:#16213e,stroke:#ffd60a,stroke-width:2px,color:#ffd60a
    classDef obj fill:#1e293b,stroke:#06b6d4,color:#a5f3fc
```

---

## Carte de compétences débloquées (skill tree)

```mermaid
flowchart TD
    ROOT(("👤 Développeur<br/>niveau 1")):::root

    ROOT --> S1(("📖 Lire un test<br/>existant")):::skill1
    ROOT --> S2(("✏️ Écrire un test<br/>basique")):::skill1

    S1 --> S3(("🎯 Tester le<br/>comportement")):::skill2
    S2 --> S3
    S2 --> S4(("🔧 Mocker<br/>les frontières")):::skill2
    S4 --> S5(("🏗️ Architecture<br/>testable / DI")):::skill2

    S3 --> S6(("🔴 TDD<br/>Red-Green-Refactor")):::skill3
    S5 --> S6
    S3 --> S7(("📝 BDD<br/>Gherkin")):::skill3

    S6 --> S8(("⏱️ Fake timers<br/>+ MSW")):::skill4
    S6 --> S9(("🎲 Property<br/>testing")):::skill4
    S7 --> S10(("🌐 E2E<br/>Playwright POM")):::skill4

    S8 --> S11(("📊 Métriques<br/>qualité")):::skill5
    S9 --> S11
    S10 --> S11

    S11 --> MASTER(("🏆 Maîtrise<br/>complète")):::master

    classDef root fill:#1a1a2e,stroke:#fff,stroke-width:2px,color:#fff
    classDef skill1 fill:#1e3a5f,stroke:#60a5fa,color:#dbeafe
    classDef skill2 fill:#1e4a3f,stroke:#34d399,color:#a7f3d0
    classDef skill3 fill:#5b3a1e,stroke:#fbbf24,color:#fde68a
    classDef skill4 fill:#5d1e4a,stroke:#f472b6,color:#fbcfe8
    classDef skill5 fill:#5d0e1e,stroke:#ef4444,color:#fecaca
    classDef master fill:#7c2d12,stroke:#fbbf24,stroke-width:3px,color:#fff
```

---

## Légende

| Forme | Sens |
|---|---|
| `["..."]` rectangle arrondi | Quête principale (module) |
| `(("..."))` cercle | Sous-objectif (sous-partie) |
| `{{"..."}}` hexagone | Acte ou Boss (étape charnière) |
| `[["..."]]` rectangle double | Checkpoint (sauvegarde) |

**Couleurs** :
- 🔴 Rouge sombre — Boss / étape clé
- 🟡 Or — Quête principale
- 🟢 Vert — Checkpoint
- 🔵 Cyan — Sous-objectif
- 🟣 Violet sombre — Maîtrise finale
