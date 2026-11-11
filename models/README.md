# Your own 3D character (optional)

By default the app shows the **X Bot** mannequin, loaded from the three.js CDN.
To use a realistic person instead (for example a bearded man), add your own Mixamo character here.
It is git-ignored: Mixamo's terms let you use characters in your projects, but not redistribute the files.

1. Sign in at [mixamo.com](https://www.mixamo.com) (free Adobe account) → **Characters** → pick one.
2. **Download** → Format *FBX Binary (.fbx)* → Pose *T-pose*.
3. Save it as `models/man.fbx` and serve the app (see the main README).
4. Recommended: open `http://localhost:5180/tools/convert-fbx.html` to shrink it into `models/man.glb`
   (e.g. 87 MB → 17 MB). Chrome blocks the automatic save, so click the download link it shows
   and move the file here as `man.glb`, then delete `man.fbx`.

The app picks up `man.glb` (or `man.fbx`) automatically. Any Mixamo-rigged character works.
