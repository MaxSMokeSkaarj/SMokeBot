function getDriftingMean() {
  const center = 0.95 + Math.random() * 0.10;
  const value  = center + (Math.random() - 0.5) * 0.10;
  return Math.max(0.9, Math.min(1.1, value));
}

function randomWideWithDriftingMean() {
  const mean = getDriftingMean();
  const spread = 1.85;
  let value = mean + (Math.random() - 0.5) * spread;
  return Math.max(0.1, Math.min(2.0, value));
}

console.log("Примеры значений (с плавающей средней):");
for (let i = 0; i < 20; i++) {
  console.log(getDriftingMean().toFixed(2), randomWideWithDriftingMean().toFixed(2));
}