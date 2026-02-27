const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const zipPath = path.join(__dirname, '../../indian-tourist-destinations/Raw Data.zip');
const publicAssetsDir = path.join(__dirname, '../../client/public/assets');
const targetRoot = path.join(publicAssetsDir, 'raw-dataset');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const normalizeSlug = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const buildManifest = (rootDir) => {
  const categories = [];
  if (!fs.existsSync(rootDir)) {
    return { generatedAt: new Date().toISOString(), categories };
  }

  const categoryDirs = fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  categoryDirs.forEach((category) => {
    const categoryPath = path.join(rootDir, category);
    const files = fs
      .readdirSync(categoryPath)
      .filter((file) => !file.startsWith('.') && !file.endsWith('.ini'))
      .map((file) => ({
        file,
        url: `/assets/raw-dataset/${encodeURIComponent(category)}/${encodeURIComponent(file)}`,
      }));

    categories.push({
      category,
      slug: normalizeSlug(category),
      count: files.length,
      files,
    });
  });

  return {
    generatedAt: new Date().toISOString(),
    totalCategories: categories.length,
    totalImages: categories.reduce((acc, c) => acc + c.count, 0),
    categories,
  };
};

const run = () => {
  if (!fs.existsSync(zipPath)) {
    console.error('Raw Data.zip not found at:', zipPath);
    process.exit(1);
  }

  ensureDir(publicAssetsDir);
  ensureDir(targetRoot);

  console.log('Extracting Raw Data.zip...');
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(targetRoot, true);

  const legacyRoot = path.join(targetRoot, 'raw dataset');
  if (fs.existsSync(legacyRoot)) {
    const entries = fs.readdirSync(legacyRoot, { withFileTypes: true });
    entries.forEach((entry) => {
      const fromPath = path.join(legacyRoot, entry.name);
      const toPath = path.join(targetRoot, entry.name);
      if (!fs.existsSync(toPath)) {
        fs.renameSync(fromPath, toPath);
      }
    });
    fs.rmSync(legacyRoot, { recursive: true, force: true });
  }

  const manifest = buildManifest(targetRoot);
  const manifestPath = path.join(targetRoot, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log('Extraction complete. Manifest saved to:', manifestPath);
  console.log(`Categories: ${manifest.totalCategories}, Images: ${manifest.totalImages}`);
};

run();
