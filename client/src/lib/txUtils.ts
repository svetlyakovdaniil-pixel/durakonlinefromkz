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
      if (desc.includes('эмоци') || desc.includes('emotion')) return `Эмоция пакетін сатып алу`;
      return `Дүкеннен сатып алу`;
    }
    if (type === 'tutorial_reward') return `Оқытуды аяқтағаны үшін сыйақы (+2000 шаңырақ)`;
    if (type === 'ad_reward') return `Жарнама сыйақысы (+${n0} шаңырақ)`;
    if (type === 'referral_reward') return `Шақыру сыйақысы`;
    if (type === 'daily_bonus') return `Күнделікті бонус`;
    if (type === 'quest_reward') return `Тапсырма сыйақысы`;
    if (type === 'achievement_reward') return `Жетістік сыйақысы`;
    if (type === 'season_reward') return `Маусым сыйақысы`;
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
      if (desc.includes('эмоци') || desc.includes('emotion')) return `Emotion pack purchase`;
      return `Shop purchase`;
    }
    if (type === 'tutorial_reward') return `Tutorial completion reward (+2000 shanyrak)`;
    if (type === 'ad_reward') return `Ad reward (+${n0} shanyrak)`;
    if (type === 'referral_reward') return `Referral reward`;
    if (type === 'daily_bonus') return `Daily bonus`;
    if (type === 'quest_reward') return `Quest reward`;
    if (type === 'achievement_reward') return `Achievement reward`;
    if (type === 'season_reward') return `Season reward`;
    return desc;
  }

  if (locale === 'uk') {
    if (type === 'free_topup') return `Безкоштовне поповнення (+${n0} тенге)`;
    if (type === 'buy_tenge') return `Придбано ${n0} тенге`;
    if (type === 'buy_shanyrak') return `Придбано ${n0}K шаніраків за ${n1} тенге`;
    if (type === 'game_reward') return `Нагорода за гру (кімната ${n0})`;
    if (type === 'game_entry') return `Ставка входу в гру (кімната ${n0})`;
    if (type === 'shop_purchase') {
      if (desc.includes('колод') || desc.includes('deck')) return `Купівля колоди карт`;
      if (desc.includes('стол') || desc.includes('table')) return `Купівля стилю столу`;
      if (desc.includes('рамк') || desc.includes('frame')) return `Купівля рамки`;
      if (desc.includes('аватар') || desc.includes('avatar')) return `Купівля аватара`;
      if (desc.includes('playlist') || desc.includes('плейлист')) return `Купівля плейлиста`;
      if (desc.includes('эмоци') || desc.includes('emotion')) return `Купівля пакету емоцій`;
      return `Покупка в магазині`;
    }
    if (type === 'tutorial_reward') return `Нагорода за проходження навчання (+2000 шаніраків)`;
    if (type === 'ad_reward') return `Нагорода за рекламу (+${n0} шаніраків)`;
    if (type === 'referral_reward') return `Нагорода за запрошення`;
    if (type === 'daily_bonus') return `Щоденний бонус`;
    if (type === 'quest_reward') return `Нагорода за завдання`;
    if (type === 'achievement_reward') return `Нагорода за досягнення`;
    if (type === 'season_reward') return `Нагорода за сезон`;
    return desc;
  }

  if (locale === 'ka') {
    if (type === 'free_topup') return `უფასო შევსება (+${n0} ტენგე)`;
    if (type === 'buy_tenge') return `შეძენილია ${n0} ტენგე`;
    if (type === 'buy_shanyrak') return `შეძენილია ${n0}K შანირაქი ${n1} ტენგეში`;
    if (type === 'game_reward') return `თამაშის ჯილდო (ოთახი ${n0})`;
    if (type === 'game_entry') return `თამაშის შესვლის ფსონი (ოთახი ${n0})`;
    if (type === 'shop_purchase') {
      if (desc.includes('колод') || desc.includes('deck')) return `ბარათების გემბანის შეძენა`;
      if (desc.includes('стол') || desc.includes('table')) return `მაგიდის სტილის შეძენა`;
      if (desc.includes('рамк') || desc.includes('frame')) return `ჩარჩოს შეძენა`;
      if (desc.includes('аватар') || desc.includes('avatar')) return `ავატარის შეძენა`;
      if (desc.includes('playlist') || desc.includes('плейлист')) return `პლეილისტის შეძენა`;
      if (desc.includes('эмоци') || desc.includes('emotion')) return `ემოციების პაკეტის შეძენა`;
      return `მაღაზიაში შეძენა`;
    }
    if (type === 'tutorial_reward') return `სწავლების დასრულების ჯილდო (+2000 შანირაქი)`;
    if (type === 'ad_reward') return `რეკლამის ჯილდო (+${n0} შანირაქი)`;
    if (type === 'referral_reward') return `მოწვევის ჯილდო`;
    if (type === 'daily_bonus') return `ყოველდღიური ბონუსი`;
    if (type === 'quest_reward') return `დავალების ჯილდო`;
    if (type === 'achievement_reward') return `მიღწევის ჯილდო`;
    if (type === 'season_reward') return `სეზონის ჯილდო`;
    return desc;
  }

  if (locale === 'az') {
    if (type === 'free_topup') return `Pulsuz doldurma (+${n0} tenge)`;
    if (type === 'buy_tenge') return `${n0} tenge alındı`;
    if (type === 'buy_shanyrak') return `${n0}K şanırak ${n1} tengeyə alındı`;
    if (type === 'game_reward') return `Oyun mükafatı (otaq ${n0})`;
    if (type === 'game_entry') return `Oyuna giriş bahası (otaq ${n0})`;
    if (type === 'shop_purchase') {
      if (desc.includes('колод') || desc.includes('deck')) return `Kart dəstəsi alışı`;
      if (desc.includes('стол') || desc.includes('table')) return `Masa stili alışı`;
      if (desc.includes('рамк') || desc.includes('frame')) return `Çərçivə alışı`;
      if (desc.includes('аватар') || desc.includes('avatar')) return `Avatar alışı`;
      if (desc.includes('playlist') || desc.includes('плейлист')) return `Pleylist alışı`;
      if (desc.includes('эмоци') || desc.includes('emotion')) return `Emosiya paketi alışı`;
      return `Mağazadan alış`;
    }
    if (type === 'tutorial_reward') return `Təlimi tamamlama mükafatı (+2000 şanırak)`;
    if (type === 'ad_reward') return `Reklam mükafatı (+${n0} şanırak)`;
    if (type === 'referral_reward') return `Dəvət mükafatı`;
    if (type === 'daily_bonus') return `Gündəlik bonus`;
    if (type === 'quest_reward') return `Tapşırıq mükafatı`;
    if (type === 'achievement_reward') return `Nailiyyət mükafatı`;
    if (type === 'season_reward') return `Mövsüm mükafatı`;
    return desc;
  }

  if (locale === 'uz') {
    if (type === 'free_topup') return `Bepul to\u02BBldirish (+${n0} tenge)`;
    if (type === 'buy_tenge') return `${n0} tenge sotib olindi`;
    if (type === 'buy_shanyrak') return `${n0}K shanırak ${n1} tengega sotib olindi`;
    if (type === 'game_reward') return `O\u02BByin mukofoti (xona ${n0})`;
    if (type === 'game_entry') return `O\u02BByin kirish stavkasi (xona ${n0})`;
    if (type === 'shop_purchase') {
      if (desc.includes('колод') || desc.includes('deck')) return `Karta to\u02BBplami xaridi`;
      if (desc.includes('стол') || desc.includes('table')) return `Stol uslubi xaridi`;
      if (desc.includes('рамк') || desc.includes('frame')) return `Ramka xaridi`;
      if (desc.includes('аватар') || desc.includes('avatar')) return `Avatar xaridi`;
      if (desc.includes('playlist') || desc.includes('плейлист')) return `Pleylist xaridi`;
      if (desc.includes('эмоци') || desc.includes('emotion')) return `Emotsiya to\u02BBplami xaridi`;
      return `Do\u02BBkonda xarid`;
    }
    if (type === 'tutorial_reward') return `O\u02BBqitishni tugatganlik uchun mukofot (+2000 shanırak)`;
    if (type === 'ad_reward') return `Reklam mukofoti (+${n0} shanırak)`;
    if (type === 'referral_reward') return `Taklif mukofoti`;
    if (type === 'daily_bonus') return `Kunlik bonus`;
    if (type === 'quest_reward') return `Vazifa mukofoti`;
    if (type === 'achievement_reward') return `Yutuq mukofoti`;
    if (type === 'season_reward') return `Mavsum mukofoti`;
    return desc;
  }

  if (locale === 'pl') {
    if (type === 'free_topup') return `Bezpłatne doładowanie (+${n0} tenge)`;
    if (type === 'buy_tenge') return `Zakupiono ${n0} tenge`;
    if (type === 'buy_shanyrak') return `Zakupiono ${n0}K szaniraków za ${n1} tenge`;
    if (type === 'game_reward') return `Nagroda za grę (pokój ${n0})`;
    if (type === 'game_entry') return `Stawka wejścia do gry (pokój ${n0})`;
    if (type === 'shop_purchase') {
      if (desc.includes('колод') || desc.includes('deck')) return `Zakup talii kart`;
      if (desc.includes('стол') || desc.includes('table')) return `Zakup stylu stołu`;
      if (desc.includes('рамк') || desc.includes('frame')) return `Zakup ramki`;
      if (desc.includes('аватар') || desc.includes('avatar')) return `Zakup awatara`;
      if (desc.includes('playlist') || desc.includes('плейлист')) return `Zakup playlisty`;
      if (desc.includes('эмоци') || desc.includes('emotion')) return `Zakup pakietu emocji`;
      return `Zakup w sklepie`;
    }
    if (type === 'tutorial_reward') return `Nagroda za ukończenie samouczka (+2000 szaniraków)`;
    if (type === 'ad_reward') return `Nagroda za reklamę (+${n0} szaniraków)`;
    if (type === 'referral_reward') return `Nagroda za zaproszenie`;
    if (type === 'daily_bonus') return `Dzienny bonus`;
    if (type === 'quest_reward') return `Nagroda za zadanie`;
    if (type === 'achievement_reward') return `Nagroda za osiągnięcie`;
    if (type === 'season_reward') return `Nagroda za sezon`;
    return desc;
  }

  return desc;
}
