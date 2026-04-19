/**
 * Localizes a transaction description stored in the database (Russian) to the user's locale.
 * The descriptions are stored as Russian strings on the server, so we pattern-match them here.
 */
export function localizeTransactionDescription(description: string, locale: string): string {
  if (locale === 'ru' || locale === 'kk') return description;

  if (locale === 'uk') {
    return localizeToUk(description);
  }

  if (locale === 'en') {
    return localizeToEn(description);
  }

  return description;
}

function localizeToUk(desc: string): string {
  // Achievement reward: "Достижение: <name>"
  if (desc.startsWith('Достижение: ')) {
    const name = desc.slice('Достижение: '.length);
    return `Досягнення: ${name}`;
  }

  // Daily quest reward: "Daily quest reward: <key>"
  if (desc.startsWith('Daily quest reward: ')) {
    const key = desc.slice('Daily quest reward: '.length);
    return `Нагорода за щоденне завдання: ${key}`;
  }

  // Deck purchase: "Покупка колоды: <id>"
  if (desc.startsWith('Покупка колоды: ')) {
    const id = desc.slice('Покупка колоды: '.length);
    return `Купівля колоди: ${id}`;
  }

  // Table purchase: "Покупка стола: <id>"
  if (desc.startsWith('Покупка стола: ')) {
    const id = desc.slice('Покупка стола: '.length);
    return `Купівля столу: ${id}`;
  }

  // Frame purchase: "Покупка рамки: <id>"
  if (desc.startsWith('Покупка рамки: ')) {
    const id = desc.slice('Покупка рамки: '.length);
    return `Купівля рамки: ${id}`;
  }

  // Avatar purchase: "Покупка аватара: <id>"
  if (desc.startsWith('Покупка аватара: ')) {
    const id = desc.slice('Покупка аватара: '.length);
    return `Купівля аватара: ${id}`;
  }

  // Emotion pack purchase: "Покупка пака эмоций: <id>"
  if (desc.startsWith('Покупка пака эмоций: ')) {
    const id = desc.slice('Покупка пака эмоций: '.length);
    return `Купівля пакету емоцій: ${id}`;
  }

  // Game bet: "Ставка на игру (комната <id>)"
  const betMatch = desc.match(/^Ставка на игру \(комната (.+)\)$/);
  if (betMatch) {
    return `Ставка на гру (кімната ${betMatch[1]})`;
  }

  // Game reward: "Награда за <N>-е место (комната <id>)"
  const rewardMatch = desc.match(/^Награда за (\d+)-е место \(комната (.+)\)$/);
  if (rewardMatch) {
    const place = rewardMatch[1];
    const room = rewardMatch[2];
    const placeUk = place === '1' ? '1-е' : place === '2' ? '2-е' : place === '3' ? '3-є' : `${place}-е`;
    return `Нагорода за ${placeUk} місце (кімната ${room})`;
  }

  // Tutorial reward: "Награда за прохождение обучения (+2000 шаныраков)"
  if (desc === 'Награда за прохождение обучения (+2000 шаныраков)') {
    return 'Нагорода за проходження навчання (+2000 шаняраків)';
  }

  // Balance top-up: "Добить баланс до 2000 (+<N> шаныраков)"
  const topupMatch = desc.match(/^Добить баланс до 2000 \(\+(\d+) шаныраков\)$/);
  if (topupMatch) {
    return `Поповнення балансу до 2000 (+${topupMatch[1]} шаняраків)`;
  }

  // Ad watch reward: "Просмотр рекламы (+<N> шаныраков)"
  const adMatch = desc.match(/^Просмотр рекламы \(\+(\d+) шаныраков\)$/);
  if (adMatch) {
    return `Перегляд реклами (+${adMatch[1]} шаняраків)`;
  }

  // Shanyrak purchase: "Куплено <N>K шаныраков за <M> тенге"
  const shanBuyMatch = desc.match(/^Куплено (\S+) шаныраков за (\d+) тенге$/);
  if (shanBuyMatch) {
    return `Куплено ${shanBuyMatch[1]} шаняраків за ${shanBuyMatch[2]} тенге`;
  }

  // Shanyrak payment: "Оплата за <N>K шаныраков"
  const shanPayMatch = desc.match(/^Оплата за (\S+) шаныраков$/);
  if (shanPayMatch) {
    return `Оплата за ${shanPayMatch[1]} шаняраків`;
  }

  // IAP tenge: "IAP: +<N> тенге (<platform>)"
  const iapMatch = desc.match(/^IAP: \+(\d+) тенге \((.+)\)$/);
  if (iapMatch) {
    return `IAP: +${iapMatch[1]} тенге (${iapMatch[2]})`;
  }

  // Referral bonus: "Бонус за использование реферального кода"
  if (desc === 'Бонус за использование реферального кода') {
    return 'Бонус за використання реферального коду';
  }

  // Referral reward: "Реферальная награда: <N> приглашений"
  const refMatch = desc.match(/^Реферальная награда: (\d+) приглашений$/);
  if (refMatch) {
    return `Реферальна нагорода: ${refMatch[1]} запрошень`;
  }

  // Playlist purchase: "Purchased playlist #<N>"
  const playlistMatch = desc.match(/^Purchased playlist #(\d+)$/);
  if (playlistMatch) {
    return `Куплено плейлист #${playlistMatch[1]}`;
  }

  // Premium subscription: "Premium subscription (expires <date>)"
  const premiumMatch = desc.match(/^Premium subscription \(expires (.+)\)$/);
  if (premiumMatch) {
    return `Premium підписка (діє до ${premiumMatch[1]})`;
  }

  // Premium IAP subscription: "Premium IAP subscription (expires <date>)"
  const premiumIapMatch = desc.match(/^Premium IAP subscription \(expires (.+)\)$/);
  if (premiumIapMatch) {
    return `Premium IAP підписка (діє до ${premiumIapMatch[1]})`;
  }

  // Admin refund: "[ADMIN REFUND] <desc>"
  if (desc.startsWith('[ADMIN REFUND] ')) {
    const inner = desc.slice('[ADMIN REFUND] '.length);
    return `[ADMIN REFUND] ${localizeToUk(inner)}`;
  }

  // Admin operation: "[Админ] <desc>"
  if (desc.startsWith('[Админ] ')) {
    const inner = desc.slice('[Админ] '.length);
    return `[Адмін] ${inner}`;
  }

  // Test operations
  if (desc === '[ТЕСТ] +10 000 шаныраков') return '[ТЕСТ] +10 000 шаняраків';
  if (desc === '[ТЕСТ] +10 000 тенге') return '[ТЕСТ] +10 000 тенге';

  // Fallback: return original
  return desc;
}

function localizeToEn(desc: string): string {
  // Achievement reward: "Достижение: <name>"
  if (desc.startsWith('Достижение: ')) {
    const name = desc.slice('Достижение: '.length);
    return `Achievement: ${name}`;
  }

  // Daily quest reward
  if (desc.startsWith('Daily quest reward: ')) return desc;

  // Deck purchase
  if (desc.startsWith('Покупка колоды: ')) {
    const id = desc.slice('Покупка колоды: '.length);
    return `Deck purchase: ${id}`;
  }

  // Table purchase
  if (desc.startsWith('Покупка стола: ')) {
    const id = desc.slice('Покупка стола: '.length);
    return `Table purchase: ${id}`;
  }

  // Frame purchase
  if (desc.startsWith('Покупка рамки: ')) {
    const id = desc.slice('Покупка рамки: '.length);
    return `Frame purchase: ${id}`;
  }

  // Avatar purchase
  if (desc.startsWith('Покупка аватара: ')) {
    const id = desc.slice('Покупка аватара: '.length);
    return `Avatar purchase: ${id}`;
  }

  // Emotion pack purchase
  if (desc.startsWith('Покупка пака эмоций: ')) {
    const id = desc.slice('Покупка пака эмоций: '.length);
    return `Emotion pack purchase: ${id}`;
  }

  // Game bet
  const betMatch = desc.match(/^Ставка на игру \(комната (.+)\)$/);
  if (betMatch) return `Game bet (room ${betMatch[1]})`;

  // Game reward
  const rewardMatch = desc.match(/^Награда за (\d+)-е место \(комната (.+)\)$/);
  if (rewardMatch) return `Reward for ${rewardMatch[1]}${rewardMatch[1] === '1' ? 'st' : rewardMatch[1] === '2' ? 'nd' : rewardMatch[1] === '3' ? 'rd' : 'th'} place (room ${rewardMatch[2]})`;

  // Tutorial reward
  if (desc === 'Награда за прохождение обучения (+2000 шаныраков)') return 'Tutorial completion reward (+2000 shanyraks)';

  // Balance top-up
  const topupMatch = desc.match(/^Добить баланс до 2000 \(\+(\d+) шаныраков\)$/);
  if (topupMatch) return `Balance top-up to 2000 (+${topupMatch[1]} shanyraks)`;

  // Ad watch
  const adMatch = desc.match(/^Просмотр рекламы \(\+(\d+) шаныраков\)$/);
  if (adMatch) return `Ad watched (+${adMatch[1]} shanyraks)`;

  // Shanyrak purchase
  const shanBuyMatch = desc.match(/^Куплено (\S+) шаныраков за (\d+) тенге$/);
  if (shanBuyMatch) return `Purchased ${shanBuyMatch[1]} shanyraks for ${shanBuyMatch[2]} tenge`;

  // Shanyrak payment
  const shanPayMatch = desc.match(/^Оплата за (\S+) шаныраков$/);
  if (shanPayMatch) return `Payment for ${shanPayMatch[1]} shanyraks`;

  // IAP tenge
  const iapMatch = desc.match(/^IAP: \+(\d+) тенге \((.+)\)$/);
  if (iapMatch) return `IAP: +${iapMatch[1]} tenge (${iapMatch[2]})`;

  // Referral bonus
  if (desc === 'Бонус за использование реферального кода') return 'Referral code bonus';

  // Referral reward
  const refMatch = desc.match(/^Реферальная награда: (\d+) приглашений$/);
  if (refMatch) return `Referral reward: ${refMatch[1]} invitations`;

  // Playlist purchase
  const playlistMatch = desc.match(/^Purchased playlist #(\d+)$/);
  if (playlistMatch) return desc;

  // Premium subscription
  const premiumMatch = desc.match(/^Premium subscription \(expires (.+)\)$/);
  if (premiumMatch) return desc;

  const premiumIapMatch = desc.match(/^Premium IAP subscription \(expires (.+)\)$/);
  if (premiumIapMatch) return desc;

  // Admin refund
  if (desc.startsWith('[ADMIN REFUND] ')) {
    const inner = desc.slice('[ADMIN REFUND] '.length);
    return `[ADMIN REFUND] ${localizeToEn(inner)}`;
  }

  // Admin operation
  if (desc.startsWith('[Админ] ')) {
    const inner = desc.slice('[Админ] '.length);
    return `[Admin] ${inner}`;
  }

  // Test operations
  if (desc === '[ТЕСТ] +10 000 шаныраков') return '[TEST] +10,000 shanyraks';
  if (desc === '[ТЕСТ] +10 000 тенге') return '[TEST] +10,000 tenge';

  return desc;
}
