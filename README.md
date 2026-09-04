# Linux Lab V5 🐧

Plateforme interactive d'apprentissage Linux, conçue pour GitHub Pages.

## V5 apporte
- Terminal Linux simulé dans le navigateur
- Système de fichiers virtuel persistant
- Navigation et commandes : pwd, ls, cd, mkdir, touch, cat, cp, mv, rm
- Permissions : ls -l, chmod
- Utilisateurs : id, groups
- Processus : ps, top, kill, systemctl
- Réseau : ip, ping, ss, curl, dig
- Logs : grep, tail
- Recherche : find
- 8 missions avec validation automatique et XP
- Badges, progression et sauvegarde via localStorage
- Vue Sandbox pour observer fichiers, processus, réseau et logs
- Responsive mobile

## Installation
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## GitHub Pages
Le projet produit un dossier `dist/`. Il peut être publié avec GitHub Pages via GitHub Actions ou un déploiement statique.

> Le terminal est volontairement **simulé** : aucune commande n'est exécutée sur la machine de l'apprenant.
