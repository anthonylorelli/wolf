# Vesper Manor — 1889 Gaslight & Mansion Restoration

A mobile- and desktop-friendly 2D pixel-art **Three.js** game about reclaiming and restoring the nine haunted wings of a sprawling late-19th-century Victorian mansion retrofitted with grounded municipal steam conduits, copper boilers, and harmonic brass wards.

## Gameplay Overview

Since the cellar boiler lost pressure during the October gale of 1889, the limelight sconces have gone dark and restless shades stir behind the peeling damask walls.

- **Banish the Gloom**: Hold **BEAM** (or `SPACE` / `Right-Click`) to focus your **Limelight Brass Lantern**, dissolving *Whispering Shades*, *Soot Wraiths*, and *Miasma Pools* into **Aether Salt**.
- **Salvage & Pressurize**: Clear rubble, cobwebs, and coal scuttles (**ACT** or `E`) for **Brass Fittings** and **Anthracite Coal**. Repairing copper boilers and ruptured steam conduits raises **Estate PSI**, unsealing heavy bulkhead doors across the manor.
- **Reclaim All Nine Wings**: Relight gas sconces, mend Victorian furnishings, and ignite each room's **Harmonic Brass Ward** to transform decayed, haunted rooms into warm gaslit halls and unlock passive engineering upgrades alongside entries in *Lord Alistair Vesper's 1889 Ledger*.

## Controls (iPhone / Touch & Desktop)

| Platform | Move | Salvage / Restore | Limelight Beam | Stoke Coal | Overview / Ledger |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **iPhone / Mobile** | Left Thumb Brass Joystick *(or tap floor)* | Tap **ACT** *(or prompt plaque)* | Hold **BEAM** | Tap **COAL** | Tap **Plan** / **Ledger** |
| **Desktop** | `WASD` / `Arrows` / `Left-Click` | `E` / Click Prompt | Hold `SPACE` / `Right-Click` | `R` | `M` / `J` / `V` / `?` |

## Development & GitHub Pages Deployment

```bash
npm install
npm run dev
npm run build
```

Pushes to `main` automatically build `./dist` with relative paths and deploy to GitHub Pages via [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml).