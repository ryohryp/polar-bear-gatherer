// src/ui/messages.js
export const LANG = 'ja';

const dict = {
  ja: {
    // 初期チップス
    'tips.drag': '画面ドラッグで移動。Cで槍クラフト。伐採・攻撃・焚き火への木材投入は自動。倒木は◎、木は▲。焚き火●で体温回復。',

    // クラフト
    'craft.ok': '槍をクラフト！攻撃力が上がった',
    'craft.done': 'もう槍は装備済み',
    'craft.lack': '木材が足りない (10必要)',

    // 焚き火
    'fire.needNear': '焚き火に近づこう',
    'fire.lack': '木材が足りない…',
    'fire.add': '焚き火をくべた！',
    'fire.add.auto': '焚き火に木材をくべた（自動）',
    'inv.hint': '焚き火は自動で木材補充',

    // 伐採
    'chop.progress': '木を伐採中…',
    'chop.progress.auto': '木を伐採中…（自動）',
    'chop.down': '木を倒した！',
    'chop.down.auto': '木を倒した！（自動）',

    // 戦闘
    'attack.hit': 'クマに攻撃！ -{dmg}',
    'bear.kill': '白熊を倒した！肉を入手',
    'bear.attack': 'クマの攻撃！-8',

    // システム
    'death': '力尽きた… Rで再開',

    // ゴール/ヒントUI
    'goal.craft': '木材10で槍クラフト → 白熊撃破で肉確保',
    'goal.fire': '焚き火の炎は自動で木材補充される',
    'goal.kill': '白熊を倒そう！',
    'goal.safe': '焚き火で温まりつつ戦うと安全',
    'goal.clear': 'クリア！ 焚き火で温まろう',
  }
};

export function t(key, vars = {}) {
  let s = (dict[LANG] && dict[LANG][key]) || key;
  for (const k in vars) s = s.replaceAll(`{${k}}`, String(vars[k]));
  return s;
}
