// Конфиг весов. Сумма всех значений = 1.0
// Чтобы изменить среднее, просто перекидывай сотые доли (0.01) между числами.
const WEIGHT_MAP = {
  0.1: 0.06, 0.2: 0.06, 0.3: 0.06, 0.4: 0.06, 0.5: 0.06,
  0.6: 0.05, 0.7: 0.05, 0.8: 0.05, 0.9: 0.05, 1.0: 0.05,
  1.1: 0.05, 1.2: 0.05, 1.3: 0.05, 1.4: 0.05, 1.5: 0.05,
  1.6: 0.04, 1.7: 0.04, 1.8: 0.04, 1.9: 0.04, 2.0: 0.04
};

/**
 * Получить случайное число на основе весов
 */
function getRandomByWeight(map) {
  const r = Math.random();
  let cumulative = 0;

  for (const [value, weight] of Object.entries(map)) {
    cumulative += weight;
    if (r <= cumulative) return parseFloat(value);
  }

  return 2.0; // На случай погрешности округления
}

// --- Тест для проверки ---
let sum = 0;
const iterations = 1000000;
for (let i = 0; i < iterations; i++) {
  sum += getRandomByWeight(WEIGHT_MAP);
}

console.log(`Среднее значение: ${(sum / iterations).toFixed(3)}`);