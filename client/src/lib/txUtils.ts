/** Translates a transaction description to the given locale */
export function translateTxDescription(tx: any, locale: string): string {
  const type = tx.type || '';
  const desc = tx.description || '';
  if (locale === 'ru') return desc;
  // Extract numbers from description for dynamic parts
  const nums = desc.match(/\d+[\d.,]*/g) || [];
  const n0 = nums[0] || '';
  const n1 = nums[1] || '';
  if (locale === 'kk') {
    if (type === 'free_topup') return `Тегін толықтыру (+${n0} тенге)`;
    if (type === 'buy_tenge') return `${n0} тенге сатып алынды`;
    if (type === 'buy_shanyrak') return `${n0}K шаңырақ сатып алынды ${n1} тенгеге`;
    if (type === 'game_reward') return `Ойын сыйақысы (бөлме ${n0})`;
    if (type === 'game_entry') return `Ойынға кіру ставкасы (бөлме ${n0})`;
    if (type === 'shop_purchase') {
      if (desc.includes('колод') || desc.includes('deck')) return `Карта дестесін сатып алу`;
      if (desc.includes('стол') || desc.includes('table')) return `Стол стилін сатып алу`;
      if (desc.includes('рамк') || desc.includes('frame')) return `Жақтауды сатып алу`;
      if (desc.includes('аватар') || desc.includes('avatar')) return `Аватарды сатып алу`;
      if (desc.includes('playlist') || desc.includes('плейлист')) return `Плейлист сатып алу`;
      return `Дүкеннен сатып алу`;
    }
    if (type === 'tutorial_reward') return `Оқытуды аяқтағаны үшін сыйақы (+2000 шаңырақ)`;
    return desc;
  }
  if (locale === 'en') {
    if (type === 'free_topup') return `Free top-up (+${n0} tenge)`;
    if (type === 'buy_tenge') return `Purchased ${n0} tenge`;
    if (type === 'buy_shanyrak') return `Purchased ${n0}K shanyrak for ${n1} tenge`;
    if (type === 'game_reward') return `Game reward (room ${n0})`;
    if (type === 'game_entry') return `Game entry bet (room ${n0})`;
    if (type === 'shop_purchase') {
      if (desc.includes('колод') || desc.includes('deck')) return `Card deck purchase`;
      if (desc.includes('стол') || desc.includes('table')) return `Table style purchase`;
      if (desc.includes('рамк') || desc.includes('frame')) return `Frame purchase`;
      if (desc.includes('аватар') || desc.includes('avatar')) return `Avatar purchase`;
      if (desc.includes('playlist') || desc.includes('плейлист')) return `Playlist purchase`;
      return `Shop purchase`;
    }
    if (type === 'tutorial_reward') return `Tutorial completion reward (+2000 shanyrak)`;
    return desc;
  }
  return desc;
}
