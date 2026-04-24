import { useState } from 'react';
import { useCampaign } from '../../state/CampaignContext';

/**
 * Epilog B: Roma Nova — narrative-only (žádná bitva).
 * Belisarius v senátě před Justiniánem. 3 dialog volby vedou ke 3 různým
 * závěrům, všechny pozitivní, politicky zaměřené.
 *
 * Odemčeno když favor == 6 po dokončení 7A/7B.
 */

interface Props {
  onFinish: () => void;
}

type Choice = 'humble' | 'assertive' | 'silence';

const SCENES = [
  {
    narration:
      'Konstantinopol, rok 559. Senát je sejít, Justinián vás povolal. Rokapla mezi sloupy, generál Belisarius, kdysi nejslavnější muž říše, stojí před trůnem. Ve tvářích senátorů je znát napětí — a v císařových očích studená zvědavost.',
  },
  {
    narration:
      'Justinián promluvil jako první: „Belisarie, nejlepší z mých generálů. Přinesl jsi říši Kartágo, Řím, Ravennu. A teď jsi znovu zachránil Konstantinopol před hunským chánem Zaberganem. Co po tobě zbývá požadovat?"',
  },
];

const CHOICES: Record<Choice, { labelCs: string; resolution: string }> = {
  humble: {
    labelCs: '„Veličenstvo, sloužil jsem pouze Kristu a tobě. Nic víc nežádám."',
    resolution:
      'Justinián sklonil hlavu. „Jsi poslední muž, který mi zbývá věrný." — Belisarius zůstal čestným služebníkem. V pozdějších letech žije v klidu jako poradce císaře. Říše má svůj mír, kterého si cení tiše a bez fanfár.',
  },
  assertive: {
    labelCs: '„Veličenstvo, říše potřebuje vojska. A ne generály v exilu."',
    resolution:
      'Justinián se na okamžik zamyslel. „Máš pravdu, Belisarie. Vrať armády, obnov východní hranici." — Belisarius se stal magistrem východu, reorganizoval vojska na perské hranici. Říše v jeho rukou znovu získává hrdost. Legendy o něm vydrží století.',
  },
  silence: {
    labelCs: '[Belisarius mlčí, hledí císaři přímo do očí.]',
    resolution:
      'Celý senát ztichl. Justinián po chvíli vstal. „Někdy mlčení znamená víc než přísaha. Odejdi v pokoji, a pokud tě říše bude potřebovat, přijdeš — jak vždy." — Belisarius byl propuštěn s nejvyššími poctami. Historii poznamenal jako tichý obránce civilizace; žije klidně, v rodinném sídle, až do smrti v 565.',
  },
};

export function EpilogBScreen({ onFinish }: Props) {
  const { campaign, dispatch } = useCampaign();
  const [scene, setScene] = useState<0 | 1 | 2>(0);
  const [chosen, setChosen] = useState<Choice | null>(null);

  if (!campaign) return null;

  if (scene < 2) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="text-amber-300 text-xs uppercase tracking-widest mb-2 text-center">
            Epilog — Roma Nova
          </div>
          <h1 className="text-2xl font-bold text-center mb-8 text-gray-100">
            V senátě v Konstantinopoli
          </h1>
          <div className="bg-amber-950/20 border border-amber-800/40 rounded-lg p-6 mb-6">
            <p className="text-gray-200 text-base leading-relaxed italic">
              {SCENES[scene]?.narration}
            </p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => setScene((scene + 1) as 1 | 2)}
              className="px-8 py-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors"
            >
              Pokračovat →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Scene 2: choice
  if (!chosen) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-6">
        <div className="max-w-3xl w-full">
          <div className="text-amber-300 text-xs uppercase tracking-widest mb-2 text-center">
            Epilog — Roma Nova
          </div>
          <h1 className="text-xl font-bold text-center mb-6 text-gray-100">
            Co odpovíš císaři?
          </h1>
          <div className="flex flex-col gap-3">
            {(['humble', 'assertive', 'silence'] as const).map(ch => (
              <button
                key={ch}
                onClick={() => setChosen(ch)}
                className="text-left p-5 rounded-lg border-2 border-amber-800 bg-amber-950/30 hover:border-amber-500 hover:bg-amber-900/40 transition-colors"
              >
                <div className="text-amber-100 text-base leading-relaxed">
                  {CHOICES[ch].labelCs}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Resolution
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-amber-300 text-xs uppercase tracking-widest mb-2 text-center">
          Epilog — Roma Nova
        </div>
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-100">
          Závěr
        </h1>
        <div className="bg-amber-950/20 border-2 border-amber-700 rounded-lg p-6 mb-6">
          <p className="text-amber-100 text-base leading-relaxed italic">
            {CHOICES[chosen].resolution}
          </p>
        </div>
        <div className="text-gray-500 text-xs text-center mb-6 italic">
          Belisariova kampaň dokončena. Justinián tvé věrnosti věřil až do konce.
        </div>
        <div className="flex justify-center">
          <button
            onClick={() => {
              // Zaznamenat epilog B jako complete
              dispatch({
                type: 'COMPLETE_SCENARIO',
                result: {
                  scenarioId: 'epilog_b',
                  victory: true,
                  secretGoalChosen: null,
                  secretGoalAchieved: false,
                  rewardChosen: null,
                  buceliariiSurvived: true,
                  buceliariiXpEarned: 0,
                  enemiesDestroyed: 0,
                  lossesSuffered: 0,
                },
              });
              onFinish();
            }}
            className="px-8 py-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors"
          >
            Dokončit kampaň →
          </button>
        </div>
      </div>
    </div>
  );
}
