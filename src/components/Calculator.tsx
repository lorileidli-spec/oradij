import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Coins,
  Landmark,
  Languages,
  Menu,
  Plus,
  Printer,
  RotateCcw,
  Scissors,
  Sparkles,
  Tags,
  Trash2,
  TrendingUp,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'

type Period = 'month' | 'quarter' | 'halfyear' | 'year'
type TabId = 'solo' | 'team' | 'owner' | 'employee' | 'pricing' | 'pricelist'
type PricelistSource = 'solo' | 'owner' | 'employee'
type Language = 'hu' | 'en' | 'cs' | 'sk'
type Currency = 'HUF' | 'EUR' | 'CZK'
type FxRates = { hufPerEur: number; hufPerCzk: number }

const FALLBACK_HUF_PER_EUR = 400
const FALLBACK_HUF_PER_CZK = 15

const isPlausibleEurHuf = (rate: number) =>
  Number.isFinite(rate) && rate > 200 && rate < 800

const isPlausibleCzkPerEur = (rate: number) =>
  Number.isFinite(rate) && rate > 15 && rate < 40

const ratesFromEur = (hufPerEur: unknown, czkPerEur: unknown): FxRates | null => {
  const eur = Number(hufPerEur)
  const czk = Number(czkPerEur)
  if (!isPlausibleEurHuf(eur) || !isPlausibleCzkPerEur(czk)) return null
  const hufPerCzk = eur / czk
  if (!(hufPerCzk > 8 && hufPerCzk < 30)) return null
  return { hufPerEur: eur, hufPerCzk }
}

const fetchExchangeRates = async (): Promise<FxRates | null> => {
  const sources = [
    async () => {
      const response = await fetch(
        'https://api.frankfurter.dev/v1/latest?base=EUR&symbols=HUF,CZK',
      )
      if (!response.ok) return null
      const data = (await response.json()) as {
        rates?: { HUF?: number; CZK?: number }
      }
      return ratesFromEur(data.rates?.HUF, data.rates?.CZK)
    },
    async () => {
      const response = await fetch('https://open.er-api.com/v6/latest/EUR')
      if (!response.ok) return null
      const data = (await response.json()) as {
        rates?: { HUF?: number; CZK?: number }
      }
      return ratesFromEur(data.rates?.HUF, data.rates?.CZK)
    },
  ]

  for (const source of sources) {
    try {
      const rates = await source()
      if (rates) return rates
    } catch {
    }
  }

  return null
}

const englishTranslations: Record<string, string> = {
  '/ hó': '/ month',
  '/ negyedév': '/ quarter',
  '/ félév': '/ half-year',
  '/ év': '/ year',
  'A jelenlegi árhoz képest': 'Compared with the current price',
  'A közös szalonköltséget egyenlő arányban osztjuk el az aktív szakemberek között.': 'Shared salon costs are divided equally among active professionals.',
  'A recepciós, marketinges és más nem termelő kollégák bérét ide írd. Ők nem számítanak az aktív szakemberek létszámába.':
    'Enter receptionist, marketing and other non-producing staff pay here. They are not counted in the active professional headcount.',
  'A teljes vállalkozás fenntartható óradíja': 'The sustainable hourly rate for the whole business',
  'Ajánlott új ár': 'Recommended new price',
  'Ajánlott új szolgáltatási ár': 'Recommended new service price',
  'Aktuális költségek': 'Current costs',
  'aktív szakember': 'active professional',
  'Alaphelyzet': 'Reset',
  'Anyagköltség': 'Material costs',
  'Állítsd be a valós számaidat, az eredmények automatikusan frissülnek.': 'Enter your actual figures and the results update automatically.',
  'Áremelés': 'Price update',
  'Áremelés tervező': 'Price adjustment planner',
  'Árazás': 'Pricing',
  'Árlista': 'Price list',
  'Árlista készítése': 'Build a price list',
  'Az óradíjadból kiszámolt szolgáltatási árak':
    'Service prices calculated from your hourly rate',
  'Ajánlott ár': 'Recommended price',
  'A fodrász részesedése': 'Stylist share',
  'A naptár hány százaléka van tényleg tele.': 'How full the calendar actually is.',
  'A százalék a teljes vendégárból számolódik.':
    'The percent is taken from the full guest price.',
  'A százalék a vendégárból az anyag után számolódik.':
    'The percent is taken from the guest price after materials.',
  'A vendégárból ennyi marad a munkatársnál.':
    'This is the coworker share of the guest price.',
  'Anyag levonása előbb': 'Deduct materials first',
  'a teljes vendégárból': 'from the full guest price',
  'anyag után a vendégárból': 'from the guest price after materials',
  'Az ajánlott ár a vendégnek mutatott, felfelé kerekített összeg. Alatta a pontos számolt érték látszik, ha eltér.':
    'The recommended price is the guest-facing amount, rounded up. The exact calculated value appears underneath if it differs.',
  'Bérezés módja': 'Pay arrangement',
  'Elszámolás': 'Settlement',
  'Fix bér': 'Fixed salary',
  'Járulék és juttatások': 'Contributions and benefits',
  'Kihasználtság': 'Occupancy',
  'kihasználtsággal': 'occupancy',
  'Munkatárs részesedése': 'Coworker share',
  'számolt': 'calculated',
  'Százalékos rendszer': 'Percentage system',
  'Átlagos havi termelés': 'Average monthly production',
  'A munkatárs havi vendégforgalma. Ebből megy a százalék, a maradék a Saját órabérem oldalon a Haszon a munkatársakon kártyán jelenik meg. Az óradíjat a termelésből számoljuk vissza.':
    'The coworker’s monthly guest revenue. The percent comes out of this; the rest appears on My hourly rate under Profit from coworkers. The hourly rate is calculated back from production.',
  'A havi termelésből ennyi a munkatársé. A maradék a Saját órabérem oldalon a Haszon a munkatársakon kártyán jelenik meg.':
    'This share of monthly production goes to the coworker. The rest appears on My hourly rate under Profit from coworkers.',
  'A százalék az anyag nélküli termelésből számolódik. Az átlagos termelésbe az anyag nélküli forgalmat írd.':
    'The percent is taken from production after materials. Enter production excluding materials.',
  'Munkatárs visz haza': 'Coworker take-home',
  'A te kártyádra megy': 'Goes to your card',
  'Visszaszámolt óradíj': 'Hourly rate from production',
  'a havi termelésből': 'from monthly production',
  'Szalon havi szükséglete': 'Salon monthly requirement',
  'Havi egyenleg': 'Monthly balance',
  'ennyi marad a költségek után': 'left after salon costs',
  'a szalon költségénél kevesebb marad': 'less remains than the salon needs',
  'Add meg a munkatárs havi termelését és a munkaidejét, hogy legyen óradíj.':
    'Enter the coworker’s monthly production and working hours to get an hourly rate.',
  'Százalékos munkatársnál ide jön a termelés maradéka, a költségek után.':
    'For percentage coworkers, the leftover production after costs appears here.',
  'ezt kell a vendégnek fizetnie az óráért': 'this is what the guest needs to pay per hour',
  'A mostani árban általában már benne van a sampon, pakolás és a styling. Ha az anyag is drágult, az új anyagárat is írd be. Az ajánlott ár az óradíj × idő plusz az új anyag.':
    'The current price usually already includes shampoo, treatment and styling. If materials also went up, enter the new material price too. The recommended price is hourly rate × time plus the new materials.',
  'anyag': 'materials',
  'munka': 'labor',
  'Először töltsd ki a választott kalkulátort, hogy legyen óradíj.':
    'Fill in the selected calculator first so there is an hourly rate.',
  'ennyivel alacsonyabb a mostani ár': 'current price is this much lower',
  'ennyivel magasabb a mostani ár': 'current price is this much higher',
  'Időtartam': 'Duration',
  'Jelenlegi ár': 'Current price',
  'Jelenlegi anyag': 'Current materials',
  'Anyag': 'Materials',
  'Mostani anyag': 'Current materials',
  'Új anyag': 'New materials',
  'Mostani anyagár': 'Current material price',
  'Új anyagár': 'New material price',
  'Saját': 'Own',
  'Kitöltött szolgáltatások': 'Priced services',
  'időtartammal megadva': 'with duration filled in',
  'Óradíj forrása': 'Hourly rate source',
  'Saját oldal': 'Own side',
  'elmarad az ajánlott ártól': 'below the recommended price',
  'eléri vagy meghaladja az ajánlott árat': 'meets or exceeds the recommended price',
  'Női hajvágás': 'Women’s haircut',
  'Férfi hajvágás': 'Men’s haircut',
  'Gyermek hajvágás': 'Children’s haircut',
  'Hajfestés': 'Hair color',
  'Melír': 'Highlights',
  'Balayage': 'Balayage',
  'Hajszárítás': 'Blow-dry',
  'Konty / alkalmi frizura': 'Updo / occasion style',
  'perc': 'min',
  'Szolgáltatás megnevezése': 'Service name',
  'Szolgáltatások': 'Services',
  'Új szolgáltatás': 'Add service',
  'választott óradíj': 'selected hourly rate',
  'átlagos havi teher': 'average monthly burden',
  'Automatikusan a szalon kalkulátorból.': 'Automatically taken from the salon calculator.',
  'Bankköltség és termináldíj': 'Bank and card terminal fees',
  'Bázisköltségek': 'Baseline costs',
  'Bér, járulék és juttatások': 'Salary, contributions and benefits',
  'Bérleti díj': 'Rent',
  'Beruházások': 'Investments',
  'beruházások nélkül': 'excluding investments',
  'Betegség pénzügyi tartaléka': 'Sickness reserve',
  'Betegszabadság tartaléka': 'Sick leave reserve',
  'Biztosítás': 'Insurance',
  'Bónusz és jutalék': 'Bonus and commission',
  'csak a saját béred': 'your own pay only',
  'Egyéb juttatás': 'Other benefits',
  'Egyéb költség': 'Other costs',
  'Egyéb közös költség': 'Other shared costs',
  'Egyéb személyes költség': 'Other personal costs',
  'Egyedi értékkel felülírva.': 'Overridden with a custom value.',
  'Egyéni': 'Solo',
  'Egyéni működés': 'Solo workflow',
  'A munkatársak kitermelendő költsége': 'The cost coworkers need to generate',
  'Egészség- és életbiztosítás': 'Health and life insurance',
  'Egyszemélyes szalon': 'Solo salon',
  'Előző időszak': 'Previous period',
  'Eredmény másolása': 'Copy result',
  'Eszközbeszerzés': 'Equipment purchase',
  'Eszközcsere ciklusa': 'Equipment replacement cycle',
  'év': 'years',
  'Élő kalkuláció': 'Live calculation',
  'Élő számítás': 'Live calculation',
  'Éves beruházási alap': 'Annual investment fund',
  'Éves beruházási tartalék': 'Annual investment reserve',
  'Éves költség / fő': 'Annual cost / person',
  'Éves összes': 'Annual total',
  'Éves szalonköltség / fő': 'Annual salon cost / person',
  'Éves szükséglet': 'Annual requirement',
  'Éves teljes költség': 'Total annual cost',
  'Fejlesztési alap': 'Development fund',
  'felújítás és eszközök': 'renovation and equipment',
  'Felújítási ciklus': 'Renovation cycle',
  'Felújítás összege': 'Renovation budget',
  'Fenntartható óradíj': 'Sustainable hourly rate',
  'Fertőtlenítő- és tisztítószerek': 'Disinfectants and cleaning supplies',
  'Fizetés': 'Salary',
  'Fizetés igényem': 'Desired salary',
  'Foglalkozás-egészségügy': 'Occupational healthcare',
  'forintos alapérték': 'HUF base value',
  'Fűtés és gáz': 'Heating and gas',
  'Gyakoriság': 'Frequency',
  'Háttérszemélyzet': 'Support staff',
  'Haszon a munkatársakon': 'Profit from coworkers',
  'Haszon a munkatárson': 'Profit from this employee',
  'Havi kiadás': 'Monthly expenses',
  'Havi szükséglet': 'Monthly requirement',
  'Havi teljes költség': 'Total monthly cost',
  'Hulladék elszállítása': 'Waste collection',
  'Időpontfoglaló és szoftverek': 'Booking and software',
  'időszakok különbsége': 'difference between periods',
  'Internet és telefon': 'Internet and phone',
  'Iparűzési adó': 'Local business tax',
  'Járulék': 'Contributions',
  'Javasolt korrekció': 'Suggested adjustment',
  'Jelenlegi időszak': 'Current period',
  'Jelenlegi szolgáltatási ár': 'Current service price',
  'Kalkulátor gyorsválasztó': 'Calculator quick selector',
  'Kalkulátor nézetek': 'Calculator views',
  'Kalkulátorok': 'Calculators',
  'Kamarai hozzájárulás': 'Chamber contribution',
  'Kapacitás': 'Capacity',
  'Karbantartás és javítás': 'Maintenance and repairs',
  'Kiadások': 'Expenses',
  'Adózás': 'Tax',
  'Adózási forma': 'Tax arrangement',
  'KATA': 'KATA',
  'Átalányadó': 'Flat-rate tax',
  'Egyéb': 'Other',
  'Havi KATA': 'Monthly KATA',
  '50.000 Ft': 'HUF 50,000',
  'Főállású katásként havonta 50.000 Ft, és kész. Az iparűzési adót a költségek között külön írd. A Járulék sort hagyd üresen, ha nincs más járulékod.':
    'For full-time KATA this is HUF 50,000 a month. Enter local business tax among the costs. Leave Contributions empty unless you have other charges.',
  'Költséghányad': 'Cost ratio',
  'Az átalányjövedelem 2026-ban évi 1.936.800 Ft-ig SZJA-mentes, főállásban és mellékállásban is. Mellékállásban (heti 36 órás munka vagy nappali suli) eddig a bevételig TB és szocho sem kell. Főállásban a minimum járulék ettől függetlenül megvan. Ez tervezés, nem hivatalos bevallás.':
    'In 2026, flat-rate income is PIT-free up to HUF 1,936,800 a year, whether this is your main or side activity. With a side activity (36+ hours of employment or full-time study) social charges are also zero up to that revenue. In a main activity the minimum contributions still apply. This is for planning, not a tax return.',
  'Vállalkozói státusz': 'Self-employment status',
  'Főállású': 'Main activity',
  'Mellékállás': 'Side activity',
  'Járulékalap': 'Contribution base',
  'Minimálbér': 'Minimum wage',
  'Szakmunkás bérminimum': 'Guaranteed skilled wage',
  'Fodrász és kozmetikus általában szakmunkás bérminimumon van.':
    'Hairdressers and beauticians usually use the skilled-wage base.',
  'Fodrászat és szépségápolás általában 80%, ha csak ebből van bevételed. Ha van más tevékenységed is, 45% az egész évre. A 90% kiskereskedelemre vonatkozik.':
    'Hairdressing and beauty care are usually 80% if that is your only activity. Any other activity makes the whole year 45%. 90% is for retail.',
  'A költséghányad a bevételed felosztása az adóhoz. Nem plusz kiadás, a Havi kiadás kártyán csak az marad, amit te írtál be.':
    'The cost ratio only splits revenue for tax. It is not an extra expense; Monthly expenses stay what you entered.',
  'Kitermelendő havi bevétel': 'Required monthly revenue',
  'Ebből költséghányad, nem valós kiadás': 'Of which cost ratio, not a real expense',
  'Ebből átalányjövedelem': 'Of which flat-rate income',
  'csak a beírt költségek, adó nélkül': 'entered costs only, excluding tax',
  'fodrász': 'hairdresser',
  'Havi adó': 'Monthly tax',
  'Adómentes havi bevétel': 'Tax-free monthly revenue',
  'Havi minimum TB + szocho': 'Monthly minimum social charges',
  'Mellékállásban eddig a havi bevételig SZJA, TB és szocho is 0 Ft.':
    'As a side activity, PIT and social charges are HUF 0 up to this monthly revenue.',
  '25 év alattiak kedvezménye': 'Under-25 tax relief',
  '25 év alatt': 'Under 25',
  '25 betöltötte': '25 or older',
  '25 év alatt SZJA nélkül, havi bevétel':
    'Monthly revenue with no PIT under 25',
  'Mellékállásban a kisebb határig minden közteher 0 Ft. A 25 év alattiak kedvezménye fölötte csak az SZJA-t viszi le, a TB és a szocho megmarad.':
    'As a side activity every levy is HUF 0 up to the lower limit. Above that, the under-25 relief removes PIT only; social charges still apply.',
  'Főállásban 25 év alatt is fizetni kell a minimum TB-t és szochót. Az SZJA a kedvezmény keretéig 0 Ft.':
    'In a main activity the minimum social charges still apply under 25. PIT is HUF 0 up to the relief cap.',
  'Családi kedvezmény': 'Family tax credit',
  'Nincs gyerek': 'No children',
  'Családi kedvezmény keret': 'Family credit cap',
  'A családi kedvezmény először az SZJA-t viszi le. Ami megmarad, a TB-ből jön le, a szochóból nem.':
    'The family credit first reduces PIT. Any leftover reduces social security, not the social tax.',
  'Becsült havi adó': 'Estimated monthly tax',
  'SZJA, KIVA, társasági adó vagy bármilyen más forma. Írd be, amit havonta félreteszel adóra és járulékra.':
    'Income tax, KIVA, corporate tax or any other form. Enter what you set aside each month for tax and contributions.',
  'Havi adó és járulék': 'Monthly tax and contributions',
  'ebből adó': 'of which tax',
  'Kimásolva': 'Copied',
  'Kitöltésre vár': 'Waiting for input',
  'Kitermelendő napidíj': 'Required daily revenue',
  'Kitermelendő óradíj': 'Required hourly revenue',
  'kerekítés nélkül számolva': 'calculated without rounding',
  'Költség': 'Cost',
  'Költség gyakorisága': 'Cost frequency',
  'Költség megnevezése': 'Cost name',
  'Költség összege': 'Cost amount',
  'költségalapú korrekció.': 'cost-based adjustment.',
  'költségváltozás': 'cost change',
  'Költségváltozásból ajánlott korrekció': 'Suggested adjustment based on cost changes',
  'Könyvelő': 'Accountant',
  'Korábbi időszak': 'Previous period',
  'Közös fejlesztési keret': 'Shared development budget',
  'Közös fogyóanyagok': 'Shared consumables',
  'Közös kiadások': 'Shared expenses',
  'Közös költség': 'Common charges',
  'Közös költségek igazságos felosztása': 'Fair allocation of shared costs',
  'Létszám és költségmegosztás': 'Team size and cost sharing',
  'Magyar forint': 'Hungarian forint',
  'Marketinges bére': 'Marketer salary',
  'Marketinges járuléka': 'Marketer contributions',
  'Marketing és hirdetések': 'Marketing and advertising',
  'Megnevezés': 'Description',
  'Menü bezárása': 'Close menu',
  'Menü megnyitása': 'Open menu',
  'Minden módosítás azonnal megjelenik az eredményekben.': 'Every change appears in the results instantly.',
  'minden teherrel együtt': 'including all employment costs',
  'minimum áremelési szint': 'minimum price adjustment',
  'Mire alkalmazzuk a változást?': 'Which price should be adjusted?',
  'Mosás és textilcsere': 'Laundry and linen replacement',
  'Működési költségek': 'Operating costs',
  'Munkába járás költsége': 'Commuting costs',
  'Munkába járás térítése': 'Commuting allowance',
  'Munkaeszközök és fogyóanyagok': 'Work equipment and consumables',
  'Munkaidő és terhelés': 'Working time and workload',
  'Munkaidő naponta': 'Working hours per day',
  'Munkáltatói teher': 'Employer costs',
  'Munkaruha': 'Workwear',
  'Munkanapok évente': 'Workdays per year',
  'Munkatárs': 'Employee',
  'Munkatársak': 'Coworkers',
  'Munkatárs jövedelme': 'Employee income',
  'Munkatárs munkaideje': 'Employee working time',
  'Munkatárs órabére': 'Employee hourly rate',
  'Munkatárs törlése': 'Remove coworker',
  'Nagyobb beruházások': 'Major investments',
  'nap': 'days',
  'Napidíjad': 'Your daily rate',
  'Nyugdíj-előtakarékosság': 'Retirement savings',
  'Oktatás és továbbképzés': 'Training and development',
  'Oktatási napok': 'Training days',
  'óra': 'hours',
  'összes vizsgált költség': 'all reviewed costs',
  'Összeg': 'Amount',
  'összesen a zsebedbe': 'total in your pocket',
  'Összes többi kiadás': 'All other expenses',
  'Az ajánlott ár a két sor összegének változásából jön. Ha csak az anyagot töltöd ki, túl sokat emelsz.':
    'The recommended price comes from the change in both rows combined. Filling in only materials overstates the increase.',
  'Pénzügyi műhely': 'Financial workshop',
  'PDF mentése': 'Save PDF',
  'Nyomtatásra kész kimutatás': 'Print-ready report',
  'Aktuális kalkuláció összefoglalója': 'Current calculation summary',
  'Rád eső rész': 'Your share',
  'Rá eső rész': 'Employee share',
  'Recepció, marketing és más nem termelő kollégák':
    'Reception, marketing and other non-producing colleagues',
  'Recepciós bére': 'Receptionist salary',
  'Recepciós járuléka': 'Receptionist contributions',
  'Riasztó és biztonságtechnika': 'Alarm and security systems',
  'Saját bér': 'Owner pay',
  'Saját költségek és jövedelem': 'Personal costs and income',
  'Saját munkaidőd': 'Your working time',
  'Saját órabéred': 'Your hourly rate',
  'Saját órabérem': 'My hourly rate',
  'Szabadság': 'Vacation',
  'Szakmai előfizetések': 'Professional subscriptions',
  'Szakmai rendezvények': 'Professional events',
  'Szalon': 'Salon',
  'Szalon éves kiadása': 'Annual salon expenses',
  'Szalon költsége': 'Salon costs',
  'Szalon költségszerkezete': 'Salon cost structure',
  'szalon pénzügyek': 'salon finances',
  'Szalon pénzügyek': 'Salon finances',
  'szalonrésszel együtt': 'including the salon share',
  'Személyes célok': 'Personal goals',
  'Szolgáltatási ár': 'Service price',
  'Szükséges napidíj': 'Required daily rate',
  'Takarítás': 'Cleaning',
  'Telefon és internet': 'Phone and internet',
  'teljes működési szükséglet': 'total operating requirement',
  'Textil, mosás és munkaruha': 'Linen, laundry and workwear',
  'Többszemélyes működés': 'Multi-person workflow',
  'Többszemélyes szalon': 'Team salon',
  'Töltsd ki mindkét időszak anyagköltségét és az összes többi kiadást.':
    'Fill in material costs and all other expenses for both periods.',
  'Add meg a jelenlegi árat, ha az új összeget is látni szeretnéd.':
    'Enter the current price if you also want to see the new amount.',
  'Nem kötelező. Ha megadod, kiszámoljuk belőle az új árat.':
    'Optional. Enter it to see the new price.',
  'Tulajdonosi céljövedelem és személyes kiadások': 'Owner income target and personal expenses',
  'Új költségsor': 'Add cost row',
  'Új munkatárs': 'Add coworker',
  'Utazás és parkolás': 'Travel and parking',
  'Változás forintban': 'Change in selected currency',
  'Vissza az automatikus értékre': 'Restore automatic value',
  'Villany': 'Electricity',
  'Víz és csatorna': 'Water and sewerage',
  'Weboldal és domain': 'Website and domain',
  'Zene- és egyéb jogdíjak': 'Music and other royalties',
  'Zsebben marad': 'Take-home income',
  'Cseh korona': 'Czech koruna',
  'Euro': 'Euro',
}

const czechTranslations: Record<string, string> = {
  '/ hó': '/ měsíc',
  '/ negyedév': '/ čtvrtletí',
  '/ félév': '/ pololetí',
  '/ év': '/ rok',
  'A jelenlegi árhoz képest': 'Oproti současné ceně',
  'A közös szalonköltséget egyenlő arányban osztjuk el az aktív szakemberek között.':
    'Společné náklady salonu rozdělíme rovným dílem mezi aktivní odborníky.',
  'A recepciós, marketinges és más nem termelő kollégák bérét ide írd. Ők nem számítanak az aktív szakemberek létszámába.':
    'Sem napište mzdy recepce, marketingu a dalších neprodukčních kolegů. Nezapočítávají se do počtu aktivních odborníků.',
  'A teljes vállalkozás fenntartható óradíja': 'Udržitelná hodinová sazba celého podniku',
  'Ajánlott új ár': 'Doporučená nová cena',
  'Ajánlott új szolgáltatási ár': 'Doporučená nová cena služby',
  'Aktuális költségek': 'Aktuální náklady',
  'aktív szakember': 'aktivní odborník',
  'Alaphelyzet': 'Reset',
  'Anyagköltség': 'Náklady na materiál',
  'Állítsd be a valós számaidat, az eredmények automatikusan frissülnek.':
    'Zadejte skutečná čísla, výsledky se aktualizují automaticky.',
  'Áremelés': 'Úprava ceny',
  'Áremelés tervező': 'Plánovač úpravy cen',
  'Árazás': 'Ceny',
  'Árlista': 'Ceník',
  'Árlista készítése': 'Sestavení ceníku',
  'Az óradíjadból kiszámolt szolgáltatási árak':
    'Ceny služeb spočítané z hodinové sazby',
  'Ajánlott ár': 'Doporučená cena',
  'A fodrász részesedése': 'Podíl kadeřníka',
  'A naptár hány százaléka van tényleg tele.': 'Jak plný kalendář ve skutečnosti je.',
  'A százalék a teljes vendégárból számolódik.':
    'Procento se počítá z celé ceny pro hosta.',
  'A százalék a vendégárból az anyag után számolódik.':
    'Procento se počítá z ceny pro hosta po odečtení materiálu.',
  'A vendégárból ennyi marad a munkatársnál.':
    'Toto je podíl kolegy z ceny pro hosta.',
  'Anyag levonása előbb': 'Nejprve odečíst materiál',
  'a teljes vendégárból': 'z celé ceny pro hosta',
  'anyag után a vendégárból': 'z ceny pro hosta po materiálu',
  'Az ajánlott ár a vendégnek mutatott, felfelé kerekített összeg. Alatta a pontos számolt érték látszik, ha eltér.':
    'Doporučená cena je částka pro hosta, zaokrouhlená nahoru. Přesná spočítaná hodnota se zobrazí pod ní, pokud se liší.',
  'Bérezés módja': 'Způsob odměny',
  'Elszámolás': 'Vyúčtování',
  'Fix bér': 'Pevná mzda',
  'Járulék és juttatások': 'Odvody a benefity',
  'Kihasználtság': 'Obsazenost',
  'kihasználtsággal': 'obsazeností',
  'Munkatárs részesedése': 'Podíl kolegy',
  'számolt': 'spočítáno',
  'Százalékos rendszer': 'Procentuální systém',
  'Átlagos havi termelés': 'Průměrná měsíční produkce',
  'A munkatárs havi vendégforgalma. Ebből megy a százalék, a maradék a Saját órabérem oldalon a Haszon a munkatársakon kártyán jelenik meg. Az óradíjat a termelésből számoljuk vissza.':
    'Měsíční tržby kolegy od hostů. Z toho jde procento; zbytek se objeví u Moje hodinová sazba na kartě Zisk z kolegů. Hodinová sazba se spočítá z produkce.',
  'A havi termelésből ennyi a munkatársé. A maradék a Saját órabérem oldalon a Haszon a munkatársakon kártyán jelenik meg.':
    'Tento podíl měsíční produkce patří kolegovi. Zbytek se objeví u Moje hodinová sazba na kartě Zisk z kolegů.',
  'A százalék az anyag nélküli termelésből számolódik. Az átlagos termelésbe az anyag nélküli forgalmat írd.':
    'Procento se počítá z produkce po materiálu. Zadejte produkci bez materiálu.',
  'Munkatárs visz haza': 'Kolega si odnese',
  'A te kártyádra megy': 'Jde na vaši kartu',
  'Visszaszámolt óradíj': 'Hodinová sazba z produkce',
  'a havi termelésből': 'z měsíční produkce',
  'Szalon havi szükséglete': 'Měsíční potřeba salonu',
  'Havi egyenleg': 'Měsíční zůstatek',
  'ennyi marad a költségek után': 'zbývá po nákladech salonu',
  'a szalon költségénél kevesebb marad': 'zbývá méně, než salon potřebuje',
  'Add meg a munkatárs havi termelését és a munkaidejét, hogy legyen óradíj.':
    'Zadejte měsíční produkci kolegy a pracovní dobu, aby byla hodinová sazba.',
  'Százalékos munkatársnál ide jön a termelés maradéka, a költségek után.':
    'U kolegů na procenta se sem dostane zbytek produkce po nákladech.',
  'ezt kell a vendégnek fizetnie az óráért': 'toto musí host zaplatit za hodinu',
  'A mostani árban általában már benne van a sampon, pakolás és a styling. Ha az anyag is drágult, az új anyagárat is írd be. Az ajánlott ár az óradíj × idő plusz az új anyag.':
    'Současná cena obvykle už obsahuje šampon, kúru a styling. Pokud zdražil i materiál, zadejte i novou cenu materiálu. Doporučená cena je hodinová sazba × čas plus nový materiál.',
  'anyag': 'materiál',
  'munka': 'práce',
  'Először töltsd ki a választott kalkulátort, hogy legyen óradíj.':
    'Nejprve vyplňte vybranou kalkulačku, aby byla hodinová sazba.',
  'ennyivel alacsonyabb a mostani ár': 'současná cena je o tolik nižší',
  'ennyivel magasabb a mostani ár': 'současná cena je o tolik vyšší',
  'Időtartam': 'Doba trvání',
  'Jelenlegi ár': 'Současná cena',
  'Jelenlegi anyag': 'Současný materiál',
  'Anyag': 'Materiál',
  'Mostani anyag': 'Současný materiál',
  'Új anyag': 'Nový materiál',
  'Mostani anyagár': 'Současná cena materiálu',
  'Új anyagár': 'Nová cena materiálu',
  'Saját': 'Vlastní',
  'Kitöltött szolgáltatások': 'Ocenené služby',
  'időtartammal megadva': 's vyplněnou délkou',
  'Óradíj forrása': 'Zdroj hodinové sazby',
  'Saját oldal': 'Vlastní strana',
  'elmarad az ajánlott ártól': 'je pod doporučenou cenou',
  'eléri vagy meghaladja az ajánlott árat': 'dosahuje nebo překračuje doporučenou cenu',
  'Női hajvágás': 'Dámský střih',
  'Férfi hajvágás': 'Pánský střih',
  'Gyermek hajvágás': 'Dětský střih',
  'Hajfestés': 'Barvení vlasů',
  'Melír': 'Melír',
  'Balayage': 'Balayage',
  'Hajszárítás': 'Fénování',
  'Konty / alkalmi frizura': 'Drdol / společenský účes',
  'perc': 'min',
  'Szolgáltatás megnevezése': 'Název služby',
  'Szolgáltatások': 'Služby',
  'Új szolgáltatás': 'Přidat službu',
  'választott óradíj': 'zvolená hodinová sazba',
  'átlagos havi teher': 'průměrná měsíční zátěž',
  'Automatikusan a szalon kalkulátorból.': 'Automaticky ze salonní kalkulačky.',
  'Bankköltség és termináldíj': 'Bankovní poplatky a poplatky za terminál',
  'Bázisköltségek': 'Základní náklady',
  'Bér, járulék és juttatások': 'Mzda, odvody a benefity',
  'Bérleti díj': 'Nájem',
  'Beruházások': 'Investice',
  'beruházások nélkül': 'bez investic',
  'Betegség pénzügyi tartaléka': 'Rezerva na nemoc',
  'Betegszabadság tartaléka': 'Rezerva na nemocenskou',
  'Biztosítás': 'Pojištění',
  'Bónusz és jutalék': 'Bonus a provize',
  'csak a saját béred': 'jen vaše vlastní mzda',
  'Egyéb juttatás': 'Ostatní benefity',
  'Egyéb költség': 'Ostatní náklady',
  'Egyéb közös költség': 'Ostatní společné náklady',
  'Egyéb személyes költség': 'Ostatní osobní náklady',
  'Egyedi értékkel felülírva.': 'Přepsáno vlastní hodnotou.',
  'Egyéni': 'Sólo',
  'Egyéni működés': 'Samostatný provoz',
  'A munkatársak kitermelendő költsége': 'Náklady, které musí kolegové vydělat',
  'Egészség- és életbiztosítás': 'Zdravotní a životní pojištění',
  'Egyszemélyes szalon': 'Samostatný salon',
  'Előző időszak': 'Předchozí období',
  'Eredmény másolása': 'Kopírovat výsledek',
  'Eszközbeszerzés': 'Nákup vybavení',
  'Eszközcsere ciklusa': 'Cyklus výměny vybavení',
  'év': 'roky',
  'Élő kalkuláció': 'Živý výpočet',
  'Élő számítás': 'Živý výpočet',
  'Éves beruházási alap': 'Roční investiční fond',
  'Éves beruházási tartalék': 'Roční investiční rezerva',
  'Éves költség / fő': 'Roční náklad / osoba',
  'Éves összes': 'Roční součet',
  'Éves szalonköltség / fő': 'Roční náklady salonu / osoba',
  'Éves szükséglet': 'Roční potřeba',
  'Éves teljes költség': 'Celkové roční náklady',
  'Fejlesztési alap': 'Rozvojový fond',
  'felújítás és eszközök': 'rekonstrukce a vybavení',
  'Felújítási ciklus': 'Cyklus rekonstrukce',
  'Felújítás összege': 'Rozpočet rekonstrukce',
  'Fenntartható óradíj': 'Udržitelná hodinová sazba',
  'Fertőtlenítő- és tisztítószerek': 'Dezinfekce a čisticí prostředky',
  'Fizetés': 'Mzda',
  'Fizetés igényem': 'Požadovaná mzda',
  'Foglalkozás-egészségügy': 'Pracovnělékařská péče',
  'forintos alapérték': 'základní hodnota v HUF',
  'Fűtés és gáz': 'Topení a plyn',
  'Gyakoriság': 'Četnost',
  'Háttérszemélyzet': 'Podpůrný personál',
  'Haszon a munkatársakon': 'Zisk z kolegů',
  'Haszon a munkatárson': 'Zisk z tohoto kolegy',
  'Havi kiadás': 'Měsíční výdaje',
  'Havi szükséglet': 'Měsíční potřeba',
  'Havi teljes költség': 'Celkové měsíční náklady',
  'Hulladék elszállítása': 'Odvoz odpadu',
  'Időpontfoglaló és szoftverek': 'Rezervace a software',
  'időszakok különbsége': 'rozdíl mezi obdobími',
  'Internet és telefon': 'Internet a telefon',
  'Iparűzési adó': 'Místní podnikatelská daň',
  'Járulék': 'Odvody',
  'Javasolt korrekció': 'Navrhovaná úprava',
  'Jelenlegi időszak': 'Aktuální období',
  'Jelenlegi szolgáltatási ár': 'Současná cena služby',
  'Kalkulátor gyorsválasztó': 'Rychlý výběr kalkulačky',
  'Kalkulátor nézetek': 'Pohledy kalkulačky',
  'Kalkulátorok': 'Kalkulačky',
  'Kamarai hozzájárulás': 'Příspěvek komoře',
  'Kapacitás': 'Kapacita',
  'Karbantartás és javítás': 'Údržba a opravy',
  'Kiadások': 'Výdaje',
  'Adózás': 'Daně',
  'Adózási forma': 'Forma zdanění',
  'KATA': 'KATA',
  'Átalányadó': 'Paušální daň',
  'Egyéb': 'Jiné',
  'Havi KATA': 'Měsíční KATA',
  '50.000 Ft': '50 000 Ft',
  'Főállású katásként havonta 50.000 Ft, és kész. Az iparűzési adót a költségek között külön írd. A Járulék sort hagyd üresen, ha nincs más járulékod.':
    'U hlavní KATA je to 50 000 Ft měsíčně. Místní daň zadejte mezi náklady. Položku Příspěvky nechte prázdnou, pokud nemáte jiné odvody.',
  'Költséghányad': 'Nákladový poměr',
  'Az átalányjövedelem 2026-ban évi 1.936.800 Ft-ig SZJA-mentes, főállásban és mellékállásban is. Mellékállásban (heti 36 órás munka vagy nappali suli) eddig a bevételig TB és szocho sem kell. Főállásban a minimum járulék ettől függetlenül megvan. Ez tervezés, nem hivatalos bevallás.':
    'Paušální příjem je v roce 2026 osvobozen od daně z příjmu do 1 936 800 Ft ročně, v hlavní i vedlejší činnosti. Ve vedlejší činnosti (36+ hodin zaměstnání nebo denní studium) do tohoto obratu neplatíte ani odvody. V hlavní činnosti minimální odvody platí i tak. Jde o plánování, ne o daňové přiznání.',
  'Vállalkozói státusz': 'Status podnikání',
  'Főállású': 'Hlavní činnost',
  'Mellékállás': 'Vedlejší činnost',
  'Járulékalap': 'Základ odvodů',
  'Minimálbér': 'Minimální mzda',
  'Szakmunkás bérminimum': 'Zaručená mzda',
  'Fodrász és kozmetikus általában szakmunkás bérminimumon van.':
    'Kadeřník a kosmetička obvykle používají zaručenou mzdu.',
  'Fodrászat és szépségápolás általában 80%, ha csak ebből van bevételed. Ha van más tevékenységed is, 45% az egész évre. A 90% kiskereskedelemre vonatkozik.':
    'Kadeřnictví a péče o krásu jsou obvykle 80 %, pokud z toho máte jediný příjem. Jiná činnost znamená 45 % za celý rok. 90 % platí pro maloobchod.',
  'A költséghányad a bevételed felosztása az adóhoz. Nem plusz kiadás, a Havi kiadás kártyán csak az marad, amit te írtál be.':
    'Nákladový poměr jen rozděluje obrat pro daň. Není to další výdaj; Měsíční výdaje zůstanou tím, co jste zadali.',
  'Kitermelendő havi bevétel': 'Potřebný měsíční obrat',
  'Ebből költséghányad, nem valós kiadás': 'Z toho nákladový poměr, ne skutečný výdaj',
  'Ebből átalányjövedelem': 'Z toho paušální příjem',
  'csak a beírt költségek, adó nélkül': 'jen zadané náklady, bez daně',
  'fodrász': 'kadeřník',
  'Havi adó': 'Měsíční daň',
  'Adómentes havi bevétel': 'Měsíční obrat bez daně',
  'Havi minimum TB + szocho': 'Měsíční minimum odvodů',
  'Mellékállásban eddig a havi bevételig SZJA, TB és szocho is 0 Ft.':
    'Ve vedlejší činnosti jsou daň i odvody do tohoto měsíčního obratu 0 Ft.',
  '25 év alattiak kedvezménye': 'Úleva do 25 let',
  '25 év alatt': 'Do 25 let',
  '25 betöltötte': '25 a více',
  '25 év alatt SZJA nélkül, havi bevétel':
    'Měsíční obrat bez daně z příjmu do 25 let',
  'Mellékállásban a kisebb határig minden közteher 0 Ft. A 25 év alattiak kedvezménye fölötte csak az SZJA-t viszi le, a TB és a szocho megmarad.':
    'Ve vedlejší činnosti je do nižší hranice vše 0 Ft. Úleva do 25 let nad to ruší jen daň z příjmu, odvody zůstávají.',
  'Főállásban 25 év alatt is fizetni kell a minimum TB-t és szochót. Az SZJA a kedvezmény keretéig 0 Ft.':
    'V hlavní činnosti se i do 25 let platí minimální odvody. Daň z příjmu je do limitu úlevy 0 Ft.',
  'Családi kedvezmény': 'Rodinná sleva na dani',
  'Nincs gyerek': 'Bez dětí',
  'Családi kedvezmény keret': 'Rámec rodinné slevy',
  'A családi kedvezmény először az SZJA-t viszi le. Ami megmarad, a TB-ből jön le, a szochóból nem.':
    'Rodinná sleva nejdřív snižuje daň z příjmu. Zbytek jde z sociálního pojištění, ne ze sociálního odvodu.',
  'Becsült havi adó': 'Odhadovaná měsíční daň',
  'SZJA, KIVA, társasági adó vagy bármilyen más forma. Írd be, amit havonta félreteszel adóra és járulékra.':
    'Daň z příjmu, KIVA, daň z příjmů právnických osob nebo jiná forma. Zadejte, co si měsíčně odkládáte na daň a odvody.',
  'Havi adó és járulék': 'Měsíční daň a odvody',
  'ebből adó': 'z toho daň',
  'Kimásolva': 'Zkopírováno',
  'Kitöltésre vár': 'Čeká na vyplnění',
  'Kitermelendő napidíj': 'Potřebný denní výnos',
  'Kitermelendő óradíj': 'Potřebná hodinová sazba',
  'kerekítés nélkül számolva': 'počítáno bez zaokrouhlení',
  'Költség': 'Náklad',
  'Költség gyakorisága': 'Četnost nákladu',
  'Költség megnevezése': 'Název nákladu',
  'Költség összege': 'Částka nákladu',
  'költségalapú korrekció.': 'korekce podle nákladů.',
  'költségváltozás': 'změna nákladů',
  'Költségváltozásból ajánlott korrekció': 'Doporučená úprava podle změny nákladů',
  'Könyvelő': 'Účetní',
  'Korábbi időszak': 'Předchozí období',
  'Közös fejlesztési keret': 'Společný rozvojový rozpočet',
  'Közös fogyóanyagok': 'Společný spotřební materiál',
  'Közös kiadások': 'Společné výdaje',
  'Közös költség': 'Společné poplatky',
  'Közös költségek igazságos felosztása': 'Spravedlivé rozdělení společných nákladů',
  'Létszám és költségmegosztás': 'Počet osob a sdílení nákladů',
  'Magyar forint': 'Maďarský forint',
  'Marketinges bére': 'Mzda marketéra',
  'Marketinges járuléka': 'Odvody marketéra',
  'Marketing és hirdetések': 'Marketing a reklama',
  'Megnevezés': 'Název',
  'Menü bezárása': 'Zavřít menu',
  'Menü megnyitása': 'Otevřít menu',
  'Minden módosítás azonnal megjelenik az eredményekben.':
    'Každá změna se ihned projeví ve výsledcích.',
  'minden teherrel együtt': 'včetně všech mzdových nákladů',
  'minimum áremelési szint': 'minimální úprava ceny',
  'Mire alkalmazzuk a változást?': 'Na kterou cenu se má změna použít?',
  'Mosás és textilcsere': 'Praní a výměna textilu',
  'Működési költségek': 'Provozní náklady',
  'Munkába járás költsége': 'Náklady na dojíždění',
  'Munkába járás térítése': 'Příspěvek na dojíždění',
  'Munkaeszközök és fogyóanyagok': 'Pracovní pomůcky a spotřební materiál',
  'Munkaidő és terhelés': 'Pracovní doba a zátěž',
  'Munkaidő naponta': 'Pracovní doba denně',
  'Munkáltatói teher': 'Náklady zaměstnavatele',
  'Munkaruha': 'Pracovní oděv',
  'Munkanapok évente': 'Pracovní dny za rok',
  'Munkatárs': 'Kolega',
  'Munkatársak': 'Kolegové',
  'Munkatárs jövedelme': 'Příjem kolegy',
  'Munkatárs munkaideje': 'Pracovní doba kolegy',
  'Munkatárs órabére': 'Hodinová sazba kolegy',
  'Munkatárs törlése': 'Odstranit kolegu',
  'Nagyobb beruházások': 'Větší investice',
  'nap': 'dny',
  'Napidíjad': 'Vaše denní sazba',
  'Nyugdíj-előtakarékosság': 'Penzijní spoření',
  'Oktatás és továbbképzés': 'Vzdělávání a rozvoj',
  'Oktatási napok': 'Školicí dny',
  'óra': 'hodiny',
  'összes vizsgált költség': 'všechny posuzované náklady',
  'Összeg': 'Částka',
  'összesen a zsebedbe': 'celkem do kapsy',
  'Összes többi kiadás': 'Všechny ostatní výdaje',
  'Az ajánlott ár a két sor összegének változásából jön. Ha csak az anyagot töltöd ki, túl sokat emelsz.':
    'Doporučená cena vychází ze změny součtu obou řádků. Pokud vyplníte jen materiál, nárůst bude nadsazený.',
  'Pénzügyi műhely': 'Finanční dílna',
  'PDF mentése': 'Uložit PDF',
  'Nyomtatásra kész kimutatás': 'Sestava k tisku',
  'Aktuális kalkuláció összefoglalója': 'Shrnutí aktuálního výpočtu',
  'Rád eső rész': 'Váš podíl',
  'Rá eső rész': 'Podíl kolegy',
  'Recepció, marketing és más nem termelő kollégák':
    'Recepce, marketing a další neprodukční kolegové',
  'Recepciós bére': 'Mzda recepční',
  'Recepciós járuléka': 'Odvody recepční',
  'Riasztó és biztonságtechnika': 'Alarm a zabezpečení',
  'Saját bér': 'Mzda majitele',
  'Saját költségek és jövedelem': 'Osobní náklady a příjem',
  'Saját munkaidőd': 'Vaše pracovní doba',
  'Saját órabéred': 'Vaše hodinová sazba',
  'Saját órabérem': 'Moje hodinová sazba',
  'Szabadság': 'Dovolená',
  'Szakmai előfizetések': 'Odborné předplatné',
  'Szakmai rendezvények': 'Odborné akce',
  'Szalon': 'Salon',
  'Szalon éves kiadása': 'Roční výdaje salonu',
  'Szalon költsége': 'Náklady salonu',
  'Szalon költségszerkezete': 'Struktura nákladů salonu',
  'szalon pénzügyek': 'finance salonu',
  'Szalon pénzügyek': 'Finance salonu',
  'szalonrésszel együtt': 'včetně podílu salonu',
  'Személyes célok': 'Osobní cíle',
  'Szolgáltatási ár': 'Cena služby',
  'Szükséges napidíj': 'Potřebná denní sazba',
  'Takarítás': 'Úklid',
  'Telefon és internet': 'Telefon a internet',
  'teljes működési szükséglet': 'celková provozní potřeba',
  'Textil, mosás és munkaruha': 'Textil, praní a pracovní oděv',
  'Többszemélyes működés': 'Provoz s více osobami',
  'Többszemélyes szalon': 'Týmový salon',
  'Töltsd ki mindkét időszak anyagköltségét és az összes többi kiadást.':
    'Vyplňte materiálové náklady a všechny ostatní výdaje za obě období.',
  'Add meg a jelenlegi árat, ha az új összeget is látni szeretnéd.':
    'Zadejte současnou cenu, pokud chcete vidět i novou částku.',
  'Nem kötelező. Ha megadod, kiszámoljuk belőle az új árat.':
    'Není povinné. Pokud ji zadáte, spočítáme z ní novou cenu.',
  'Tulajdonosi céljövedelem és személyes kiadások':
    'Cílový příjem majitele a osobní výdaje',
  'Új költségsor': 'Přidat náklad',
  'Új munkatárs': 'Přidat kolegu',
  'Utazás és parkolás': 'Cestování a parkování',
  'Változás forintban': 'Změna ve zvolené měně',
  'Vissza az automatikus értékre': 'Obnovit automatickou hodnotu',
  'Villany': 'Elektřina',
  'Víz és csatorna': 'Voda a kanalizace',
  'Weboldal és domain': 'Web a doména',
  'Zene- és egyéb jogdíjak': 'Hudební a další autorské poplatky',
  'Zsebben marad': 'Zbude v kapse',
  'Cseh korona': 'Česká koruna',
  'Euro': 'Euro',
}

const slovakTranslations: Record<string, string> = {
  '/ hó': '/ mesiac',
  '/ negyedév': '/ štvrťrok',
  '/ félév': '/ polrok',
  '/ év': '/ rok',
  'A jelenlegi árhoz képest': 'V porovnaní so súčasnou cenou',
  'A közös szalonköltséget egyenlő arányban osztjuk el az aktív szakemberek között.':
    'Spoločné náklady salónu rozdelíme rovným dielom medzi aktívnych odborníkov.',
  'A recepciós, marketinges és más nem termelő kollégák bérét ide írd. Ők nem számítanak az aktív szakemberek létszámába.':
    'Sem zadajte mzdy recepcie, marketingu a ďalších neprodukčných kolegov. Nezapočítavajú sa do počtu aktívnych odborníkov.',
  'A teljes vállalkozás fenntartható óradíja': 'Udržateľná hodinová sadzba celého podniku',
  'Ajánlott új ár': 'Odporúčaná nová cena',
  'Ajánlott új szolgáltatási ár': 'Odporúčaná nová cena služby',
  'Aktuális költségek': 'Aktuálne náklady',
  'aktív szakember': 'aktívny odborník',
  'Alaphelyzet': 'Reset',
  'Anyagköltség': 'Náklady na materiál',
  'Állítsd be a valós számaidat, az eredmények automatikusan frissülnek.':
    'Zadajte skutočné čísla, výsledky sa aktualizujú automaticky.',
  'Áremelés': 'Úprava ceny',
  'Áremelés tervező': 'Plánovač úpravy cien',
  'Árazás': 'Ceny',
  'Árlista': 'Cenník',
  'Árlista készítése': 'Zostavenie cenníka',
  'Az óradíjadból kiszámolt szolgáltatási árak':
    'Ceny služieb spočítané z hodinovej sadzby',
  'Ajánlott ár': 'Odporúčaná cena',
  'A fodrász részesedése': 'Podiel kaderníka',
  'A naptár hány százaléka van tényleg tele.': 'Ako plný kalendár v skutočnosti je.',
  'A százalék a teljes vendégárból számolódik.':
    'Percento sa počíta z celej ceny pre hosťa.',
  'A százalék a vendégárból az anyag után számolódik.':
    'Percento sa počíta z ceny pre hosťa po odpočítaní materiálu.',
  'A vendégárból ennyi marad a munkatársnál.':
    'Toto je podiel kolegu z ceny pre hosťa.',
  'Anyag levonása előbb': 'Najprv odpočítať materiál',
  'a teljes vendégárból': 'z celej ceny pre hosťa',
  'anyag után a vendégárból': 'z ceny pre hosťa po materiáli',
  'Az ajánlott ár a vendégnek mutatott, felfelé kerekített összeg. Alatta a pontos számolt érték látszik, ha eltér.':
    'Odporúčaná cena je suma pre hosťa, zaokrúhlená nahor. Presná spočítaná hodnota sa zobrazí pod ňou, ak sa líši.',
  'Bérezés módja': 'Spôsob odmeny',
  'Elszámolás': 'Vyúčtovanie',
  'Fix bér': 'Pevná mzda',
  'Járulék és juttatások': 'Odvody a benefity',
  'Kihasználtság': 'Obsadenosť',
  'kihasználtsággal': 'obsadenosťou',
  'Munkatárs részesedése': 'Podiel kolegu',
  'számolt': 'spočítané',
  'Százalékos rendszer': 'Percentuálny systém',
  'Átlagos havi termelés': 'Priemerná mesačná produkcia',
  'A munkatárs havi vendégforgalma. Ebből megy a százalék, a maradék a Saját órabérem oldalon a Haszon a munkatársakon kártyán jelenik meg. Az óradíjat a termelésből számoljuk vissza.':
    'Mesačné tržby kolegu od hostí. Z toho ide percento; zvyšok sa objaví pri Moja hodinová sadzba na karte Zisk z kolegov. Hodinová sadzba sa spočíta z produkcie.',
  'A havi termelésből ennyi a munkatársé. A maradék a Saját órabérem oldalon a Haszon a munkatársakon kártyán jelenik meg.':
    'Tento podiel mesačnej produkcie patrí kolegovi. Zvyšok sa objaví pri Moja hodinová sadzba na karte Zisk z kolegov.',
  'A százalék az anyag nélküli termelésből számolódik. Az átlagos termelésbe az anyag nélküli forgalmat írd.':
    'Percento sa počíta z produkcie po materiáli. Zadajte produkciu bez materiálu.',
  'Munkatárs visz haza': 'Kolega si odnesie',
  'A te kártyádra megy': 'Ide na vašu kartu',
  'Visszaszámolt óradíj': 'Hodinová sadzba z produkcie',
  'a havi termelésből': 'z mesačnej produkcie',
  'Szalon havi szükséglete': 'Mesačná potreba salónu',
  'Havi egyenleg': 'Mesačný zostatok',
  'ennyi marad a költségek után': 'zostáva po nákladoch salónu',
  'a szalon költségénél kevesebb marad': 'zostáva menej, než salón potrebuje',
  'Add meg a munkatárs havi termelését és a munkaidejét, hogy legyen óradíj.':
    'Zadajte mesačnú produkciu kolegu a pracovný čas, aby bola hodinová sadzba.',
  'Százalékos munkatársnál ide jön a termelés maradéka, a költségek után.':
    'Pri kolegoch na percentá sa sem dostane zvyšok produkcie po nákladoch.',
  'ezt kell a vendégnek fizetnie az óráért': 'toto musí hosť zaplatiť za hodinu',
  'A mostani árban általában már benne van a sampon, pakolás és a styling. Ha az anyag is drágult, az új anyagárat is írd be. Az ajánlott ár az óradíj × idő plusz az új anyag.':
    'Súčasná cena zvyčajne už obsahuje šampón, kúru a styling. Ak zdražel aj materiál, zadajte aj novú cenu materiálu. Odporúčaná cena je hodinová sadzba × čas plus nový materiál.',
  'anyag': 'materiál',
  'munka': 'práca',
  'Először töltsd ki a választott kalkulátort, hogy legyen óradíj.':
    'Najprv vyplňte vybranú kalkulačku, aby bola hodinová sadzba.',
  'ennyivel alacsonyabb a mostani ár': 'súčasná cena je o toľko nižšia',
  'ennyivel magasabb a mostani ár': 'súčasná cena je o toľko vyššia',
  'Időtartam': 'Trvanie',
  'Jelenlegi ár': 'Súčasná cena',
  'Jelenlegi anyag': 'Súčasný materiál',
  'Anyag': 'Materiál',
  'Mostani anyag': 'Súčasný materiál',
  'Új anyag': 'Nový materiál',
  'Mostani anyagár': 'Súčasná cena materiálu',
  'Új anyagár': 'Nová cena materiálu',
  'Saját': 'Vlastné',
  'Kitöltött szolgáltatások': 'Ocenené služby',
  'időtartammal megadva': 's vyplneným trvaním',
  'Óradíj forrása': 'Zdroj hodinovej sadzby',
  'Saját oldal': 'Vlastná strana',
  'elmarad az ajánlott ártól': 'je pod odporúčanou cenou',
  'eléri vagy meghaladja az ajánlott árat': 'dosahuje alebo presahuje odporúčanú cenu',
  'Női hajvágás': 'Dámsky strih',
  'Férfi hajvágás': 'Pánsky strih',
  'Gyermek hajvágás': 'Detský strih',
  'Hajfestés': 'Farbenie vlasov',
  'Melír': 'Melír',
  'Balayage': 'Balayage',
  'Hajszárítás': 'Fénovanie',
  'Konty / alkalmi frizura': 'Drdol / spoločenský účes',
  'perc': 'min',
  'Szolgáltatás megnevezése': 'Názov služby',
  'Szolgáltatások': 'Služby',
  'Új szolgáltatás': 'Pridať službu',
  'választott óradíj': 'zvolená hodinová sadzba',
  'átlagos havi teher': 'priemerná mesačná záťaž',
  'Automatikusan a szalon kalkulátorból.': 'Automaticky zo salónnej kalkulačky.',
  'Bankköltség és termináldíj': 'Bankové poplatky a poplatky za terminál',
  'Bázisköltségek': 'Základné náklady',
  'Bér, járulék és juttatások': 'Mzda, odvody a benefity',
  'Bérleti díj': 'Nájom',
  'Beruházások': 'Investície',
  'beruházások nélkül': 'bez investícií',
  'Betegség pénzügyi tartaléka': 'Rezerva na chorobu',
  'Betegszabadság tartaléka': 'Rezerva na práceneschopnosť',
  'Biztosítás': 'Poistenie',
  'Bónusz és jutalék': 'Bonus a provízia',
  'csak a saját béred': 'len vaša vlastná mzda',
  'Egyéb juttatás': 'Ostatné benefity',
  'Egyéb költség': 'Ostatné náklady',
  'Egyéb közös költség': 'Ostatné spoločné náklady',
  'Egyéb személyes költség': 'Ostatné osobné náklady',
  'Egyedi értékkel felülírva.': 'Prepísané vlastnou hodnotou.',
  'Egyéni': 'Sólo',
  'Egyéni működés': 'Samostatná prevádzka',
  'A munkatársak kitermelendő költsége': 'Náklady, ktoré musia kolegovia zarobiť',
  'Egészség- és életbiztosítás': 'Zdravotné a životné poistenie',
  'Egyszemélyes szalon': 'Samostatný salón',
  'Előző időszak': 'Predchádzajúce obdobie',
  'Eredmény másolása': 'Kopírovať výsledok',
  'Eszközbeszerzés': 'Nákup vybavenia',
  'Eszközcsere ciklusa': 'Cyklus výmeny vybavenia',
  'év': 'roky',
  'Élő kalkuláció': 'Živý výpočet',
  'Élő számítás': 'Živý výpočet',
  'Éves beruházási alap': 'Ročný investičný fond',
  'Éves beruházási tartalék': 'Ročná investičná rezerva',
  'Éves költség / fő': 'Ročný náklad / osoba',
  'Éves összes': 'Ročný súčet',
  'Éves szalonköltség / fő': 'Ročné náklady salónu / osoba',
  'Éves szükséglet': 'Ročná potreba',
  'Éves teljes költség': 'Celkové ročné náklady',
  'Fejlesztési alap': 'Rozvojový fond',
  'felújítás és eszközök': 'rekonštrukcia a vybavenie',
  'Felújítási ciklus': 'Cyklus rekonštrukcie',
  'Felújítás összege': 'Rozpočet rekonštrukcie',
  'Fenntartható óradíj': 'Udržateľná hodinová sadzba',
  'Fertőtlenítő- és tisztítószerek': 'Dezinfekcia a čistiace prostriedky',
  'Fizetés': 'Mzda',
  'Fizetés igényem': 'Požadovaná mzda',
  'Foglalkozás-egészségügy': 'Pracovná zdravotná služba',
  'forintos alapérték': 'základná hodnota v HUF',
  'Fűtés és gáz': 'Kúrenie a plyn',
  'Gyakoriság': 'Častosť',
  'Háttérszemélyzet': 'Podporný personál',
  'Haszon a munkatársakon': 'Zisk z kolegov',
  'Haszon a munkatárson': 'Zisk z tohto kolegu',
  'Havi kiadás': 'Mesačné výdavky',
  'Havi szükséglet': 'Mesačná potreba',
  'Havi teljes költség': 'Celkové mesačné náklady',
  'Hulladék elszállítása': 'Odvoz odpadu',
  'Időpontfoglaló és szoftverek': 'Rezervácie a softvér',
  'időszakok különbsége': 'rozdiel medzi obdobiami',
  'Internet és telefon': 'Internet a telefón',
  'Iparűzési adó': 'Miestna podnikateľská daň',
  'Járulék': 'Odvody',
  'Javasolt korrekció': 'Navrhovaná úprava',
  'Jelenlegi időszak': 'Aktuálne obdobie',
  'Jelenlegi szolgáltatási ár': 'Súčasná cena služby',
  'Kalkulátor gyorsválasztó': 'Rýchly výber kalkulačky',
  'Kalkulátor nézetek': 'Pohľady kalkulačky',
  'Kalkulátorok': 'Kalkulačky',
  'Kamarai hozzájárulás': 'Príspevok komore',
  'Kapacitás': 'Kapacita',
  'Karbantartás és javítás': 'Údržba a opravy',
  'Kiadások': 'Výdavky',
  'Adózás': 'Dane',
  'Adózási forma': 'Forma zdanenia',
  'KATA': 'KATA',
  'Átalányadó': 'Paušálna daň',
  'Egyéb': 'Iné',
  'Havi KATA': 'Mesačná KATA',
  '50.000 Ft': '50 000 Ft',
  'Főállású katásként havonta 50.000 Ft, és kész. Az iparűzési adót a költségek között külön írd. A Járulék sort hagyd üresen, ha nincs más járulékod.':
    'Pri hlavnej KATA je to 50 000 Ft mesačne. Miestnu daň zadajte medzi náklady. Položku Príspevky nechajte prázdnu, ak nemáte iné odvody.',
  'Költséghányad': 'Nákladový pomer',
  'Az átalányjövedelem 2026-ban évi 1.936.800 Ft-ig SZJA-mentes, főállásban és mellékállásban is. Mellékállásban (heti 36 órás munka vagy nappali suli) eddig a bevételig TB és szocho sem kell. Főállásban a minimum járulék ettől függetlenül megvan. Ez tervezés, nem hivatalos bevallás.':
    'Paušálny príjem je v roku 2026 oslobodený od dane z príjmu do 1 936 800 Ft ročne, v hlavnej aj vedľajšej činnosti. Vo vedľajšej činnosti (36+ hodín zamestnania alebo denné štúdium) do tohto obratu neplatíte ani odvody. V hlavnej činnosti minimálne odvody platia aj tak. Ide o plánovanie, nie o daňové priznanie.',
  'Vállalkozói státusz': 'Status podnikania',
  'Főállású': 'Hlavná činnosť',
  'Mellékállás': 'Vedľajšia činnosť',
  'Járulékalap': 'Základ odvodov',
  'Minimálbér': 'Minimálna mzda',
  'Szakmunkás bérminimum': 'Zaručená mzda',
  'Fodrász és kozmetikus általában szakmunkás bérminimumon van.':
    'Kaderník a kozmetička zvyčajne používajú zaručenú mzdu.',
  'Fodrászat és szépségápolás általában 80%, ha csak ebből van bevételed. Ha van más tevékenységed is, 45% az egész évre. A 90% kiskereskedelemre vonatkozik.':
    'Kaderníctvo a starostlivosť o krásu sú zvyčajne 80 %, ak z toho máte jediný príjem. Iná činnosť znamená 45 % za celý rok. 90 % platí pre maloobchod.',
  'A költséghányad a bevételed felosztása az adóhoz. Nem plusz kiadás, a Havi kiadás kártyán csak az marad, amit te írtál be.':
    'Nákladový pomer len rozdeľuje obrat pre daň. Nie je to ďalší výdavok; Mesačné výdavky ostanú tým, čo ste zadali.',
  'Kitermelendő havi bevétel': 'Potrebný mesačný obrat',
  'Ebből költséghányad, nem valós kiadás': 'Z toho nákladový pomer, nie skutočný výdavok',
  'Ebből átalányjövedelem': 'Z toho paušálny príjem',
  'csak a beírt költségek, adó nélkül': 'len zadané náklady, bez dane',
  'fodrász': 'kaderník',
  'Havi adó': 'Mesačná daň',
  'Adómentes havi bevétel': 'Mesačný obrat bez dane',
  'Havi minimum TB + szocho': 'Mesačné minimum odvodov',
  'Mellékállásban eddig a havi bevételig SZJA, TB és szocho is 0 Ft.':
    'Vo vedľajšej činnosti sú daň aj odvody do tohto mesačného obratu 0 Ft.',
  '25 év alattiak kedvezménye': 'Úľava do 25 rokov',
  '25 év alatt': 'Do 25 rokov',
  '25 betöltötte': '25 a viac',
  '25 év alatt SZJA nélkül, havi bevétel':
    'Mesačný obrat bez dane z príjmu do 25 rokov',
  'Mellékállásban a kisebb határig minden közteher 0 Ft. A 25 év alattiak kedvezménye fölötte csak az SZJA-t viszi le, a TB és a szocho megmarad.':
    'Vo vedľajšej činnosti je do nižšej hranice všetko 0 Ft. Úľava do 25 rokov nad to ruší len daň z príjmu, odvody ostávajú.',
  'Főállásban 25 év alatt is fizetni kell a minimum TB-t és szochót. Az SZJA a kedvezmény keretéig 0 Ft.':
    'V hlavnej činnosti sa aj do 25 rokov platia minimálne odvody. Daň z príjmu je do limitu úľavy 0 Ft.',
  'Családi kedvezmény': 'Rodinná úľava na dani',
  'Nincs gyerek': 'Bez detí',
  'Családi kedvezmény keret': 'Rámec rodinnej úľavy',
  'A családi kedvezmény először az SZJA-t viszi le. Ami megmarad, a TB-ből jön le, a szochóból nem.':
    'Rodinná úľava najprv znižuje daň z príjmu. Zvyšok ide zo sociálneho poistenia, nie zo sociálneho odvodu.',
  'Becsült havi adó': 'Odhadovaná mesačná daň',
  'SZJA, KIVA, társasági adó vagy bármilyen más forma. Írd be, amit havonta félreteszel adóra és járulékra.':
    'Daň z príjmu, KIVA, daň z príjmov právnických osôb alebo iná forma. Zadajte, čo si mesačne odkladáte na daň a odvody.',
  'Havi adó és járulék': 'Mesačná daň a odvody',
  'ebből adó': 'z toho daň',
  'Kimásolva': 'Skopírované',
  'Kitöltésre vár': 'Čaká na vyplnenie',
  'Kitermelendő napidíj': 'Potrebný denný výnos',
  'Kitermelendő óradíj': 'Potrebná hodinová sadzba',
  'kerekítés nélkül számolva': 'počítané bez zaokrúhlenia',
  'Költség': 'Náklad',
  'Költség gyakorisága': 'Častosť nákladu',
  'Költség megnevezése': 'Názov nákladu',
  'Költség összege': 'Suma nákladu',
  'költségalapú korrekció.': 'korekcia podľa nákladov.',
  'költségváltozás': 'zmena nákladov',
  'Költségváltozásból ajánlott korrekció': 'Odporúčaná úprava podľa zmeny nákladov',
  'Könyvelő': 'Účtovník',
  'Korábbi időszak': 'Predchádzajúce obdobie',
  'Közös fejlesztési keret': 'Spoločný rozvojový rozpočet',
  'Közös fogyóanyagok': 'Spoločný spotrebný materiál',
  'Közös kiadások': 'Spoločné výdavky',
  'Közös költség': 'Spoločné poplatky',
  'Közös költségek igazságos felosztása': 'Spravodlivé rozdelenie spoločných nákladov',
  'Létszám és költségmegosztás': 'Počet osôb a zdieľanie nákladov',
  'Magyar forint': 'Maďarský forint',
  'Marketinges bére': 'Mzda marketéra',
  'Marketinges járuléka': 'Odvody marketéra',
  'Marketing és hirdetések': 'Marketing a reklama',
  'Megnevezés': 'Názov',
  'Menü bezárása': 'Zavrieť menu',
  'Menü megnyitása': 'Otvoriť menu',
  'Minden módosítás azonnal megjelenik az eredményekben.':
    'Každá zmena sa hneď prejaví vo výsledkoch.',
  'minden teherrel együtt': 'vrátane všetkých mzdových nákladov',
  'minimum áremelési szint': 'minimálna úprava ceny',
  'Mire alkalmazzuk a változást?': 'Na ktorú cenu sa má zmena použiť?',
  'Mosás és textilcsere': 'Pranie a výmena textilu',
  'Működési költségek': 'Prevádzkové náklady',
  'Munkába járás költsége': 'Náklady na dochádzanie',
  'Munkába járás térítése': 'Príspevok na dochádzanie',
  'Munkaeszközök és fogyóanyagok': 'Pracovné pomôcky a spotrebný materiál',
  'Munkaidő és terhelés': 'Pracovný čas a záťaž',
  'Munkaidő naponta': 'Pracovný čas denne',
  'Munkáltatói teher': 'Náklady zamestnávateľa',
  'Munkaruha': 'Pracovný odev',
  'Munkanapok évente': 'Pracovné dni za rok',
  'Munkatárs': 'Kolega',
  'Munkatársak': 'Kolegovia',
  'Munkatárs jövedelme': 'Príjem kolegu',
  'Munkatárs munkaideje': 'Pracovný čas kolegu',
  'Munkatárs órabére': 'Hodinová sadzba kolegu',
  'Munkatárs törlése': 'Odstrániť kolegu',
  'Nagyobb beruházások': 'Väčšie investície',
  'nap': 'dni',
  'Napidíjad': 'Vaša denná sadzba',
  'Nyugdíj-előtakarékosság': 'Dôchodkové sporenie',
  'Oktatás és továbbképzés': 'Vzdelávanie a rozvoj',
  'Oktatási napok': 'Školiace dni',
  'óra': 'hodiny',
  'összes vizsgált költség': 'všetky posudzované náklady',
  'Összeg': 'Suma',
  'összesen a zsebedbe': 'spolu do vrecka',
  'Összes többi kiadás': 'Všetky ostatné výdavky',
  'Az ajánlott ár a két sor összegének változásából jön. Ha csak az anyagot töltöd ki, túl sokat emelsz.':
    'Odporúčaná cena vychádza zo zmeny súčtu oboch riadkov. Ak vyplníte len materiál, nárast bude nadhodnotený.',
  'Pénzügyi műhely': 'Finančná dielňa',
  'PDF mentése': 'Uložiť PDF',
  'Nyomtatásra kész kimutatás': 'Zostava na tlač',
  'Aktuális kalkuláció összefoglalója': 'Zhrnutie aktuálneho výpočtu',
  'Rád eső rész': 'Váš podiel',
  'Rá eső rész': 'Podiel kolegu',
  'Recepció, marketing és más nem termelő kollégák':
    'Recepcia, marketing a ďalší neprodukční kolegovia',
  'Recepciós bére': 'Mzda recepčnej',
  'Recepciós járuléka': 'Odvody recepčnej',
  'Riasztó és biztonságtechnika': 'Alarm a zabezpečenie',
  'Saját bér': 'Mzda majiteľa',
  'Saját költségek és jövedelem': 'Osobné náklady a príjem',
  'Saját munkaidőd': 'Váš pracovný čas',
  'Saját órabéred': 'Vaša hodinová sadzba',
  'Saját órabérem': 'Moja hodinová sadzba',
  'Szabadság': 'Dovolenka',
  'Szakmai előfizetések': 'Odborné predplatné',
  'Szakmai rendezvények': 'Odborné podujatia',
  'Szalon': 'Salón',
  'Szalon éves kiadása': 'Ročné výdavky salónu',
  'Szalon költsége': 'Náklady salónu',
  'Szalon költségszerkezete': 'Štruktúra nákladov salónu',
  'szalon pénzügyek': 'financie salónu',
  'Szalon pénzügyek': 'Financie salónu',
  'szalonrésszel együtt': 'vrátane podielu salónu',
  'Személyes célok': 'Osobné ciele',
  'Szolgáltatási ár': 'Cena služby',
  'Szükséges napidíj': 'Potrebná denná sadzba',
  'Takarítás': 'Upratovanie',
  'Telefon és internet': 'Telefón a internet',
  'teljes működési szükséglet': 'celková prevádzková potreba',
  'Textil, mosás és munkaruha': 'Textil, pranie a pracovný odev',
  'Többszemélyes működés': 'Prevádzka s viacerými osobami',
  'Többszemélyes szalon': 'Tímový salón',
  'Töltsd ki mindkét időszak anyagköltségét és az összes többi kiadást.':
    'Vyplňte materiálové náklady a všetky ostatné výdavky za obe obdobia.',
  'Add meg a jelenlegi árat, ha az új összeget is látni szeretnéd.':
    'Zadajte súčasnú cenu, ak chcete vidieť aj novú sumu.',
  'Nem kötelező. Ha megadod, kiszámoljuk belőle az új árat.':
    'Nie je povinné. Ak ju zadáte, spočítame z nej novú cenu.',
  'Tulajdonosi céljövedelem és személyes kiadások':
    'Cieľový príjem majiteľa a osobné výdavky',
  'Új költségsor': 'Pridať náklad',
  'Új munkatárs': 'Pridať kolegu',
  'Utazás és parkolás': 'Cestovanie a parkovanie',
  'Változás forintban': 'Zmena vo zvolenej mene',
  'Vissza az automatikus értékre': 'Obnoviť automatickú hodnotu',
  'Villany': 'Elektrina',
  'Víz és csatorna': 'Voda a kanalizácia',
  'Weboldal és domain': 'Web a doména',
  'Zene- és egyéb jogdíjak': 'Hudobné a ďalšie autorské poplatky',
  'Zsebben marad': 'Zostane v peňaženke',
  'Cseh korona': 'Česká koruna',
  'Euro': 'Euro',
}

const translationTables: Record<Exclude<Language, 'hu'>, Record<string, string>> = {
  en: englishTranslations,
  cs: czechTranslations,
  sk: slovakTranslations,
}

const hungarianKeyFor = (text: string) => {
  for (const table of Object.values(translationTables)) {
    const key = Object.entries(table).find(([, value]) => value === text)?.[0]
    if (key) return key
  }
  return undefined
}

const translate = (language: Language, text: string) => {
  if (language === 'hu') return hungarianKeyFor(text) ?? text
  const table = translationTables[language]
  if (table[text]) return table[text]
  const hungarianKey = hungarianKeyFor(text)
  return (hungarianKey && table[hungarianKey]) || text
}

const textByLang = (
  language: Language,
  hu: string,
  en: string,
  cs: string,
  sk: string,
) => {
  if (language === 'sk') return sk
  if (language === 'cs') return cs
  if (language === 'en') return en
  return hu
}

const LocaleContext = createContext({
  language: 'hu' as Language,
  currency: 'HUF' as Currency,
  hufPerEur: FALLBACK_HUF_PER_EUR,
  hufPerCzk: FALLBACK_HUF_PER_CZK,
})

const useLocale = () => useContext(LocaleContext)

type Cost = {
  id: number
  name: string
  period: Period
  amount: number
}

type CostTemplate = Omit<Cost, 'id'>

type PayMode = 'salary' | 'percent'
type TaxForm = 'kata' | 'atalany' | 'custom'
type AtalanyCostRatio = 45 | 80 | 90
type AtalanyStatus = 'main' | 'side'
type AtalanyWageBase = 'minimum' | 'skilled'

type TaxSettings = {
  form: TaxForm
  kataMonthly: number
  atalanyCostRatio: AtalanyCostRatio
  atalanyStatus: AtalanyStatus
  atalanyWageBase: AtalanyWageBase
  under25: boolean
  familyChildren: number
  customMonthly: number
}

const initialTax: TaxSettings = {
  form: 'kata',
  kataMonthly: 0,
  atalanyCostRatio: 80,
  atalanyStatus: 'main',
  atalanyWageBase: 'skilled',
  under25: false,
  familyChildren: 0,
  customMonthly: 0,
}

const KATA_MONTHLY_HUF = 50_000
const MIN_WAGE_MONTHLY = 322_800
const SKILLED_WAGE_MONTHLY = 373_200
const ATALANY_SZJA_RATE = 0.15
const ATALANY_TB_RATE = 0.185
const ATALANY_SZOCHO_RATE = 0.13
const ATALANY_CONTRIB_RATE = ATALANY_TB_RATE + ATALANY_SZOCHO_RATE
const ATALANY_TAX_FREE_INCOME = (MIN_WAGE_MONTHLY * 12) / 2
const UNDER25_MONTHLY = 715_765
const UNDER25_ANNUAL = UNDER25_MONTHLY * 12
const atalanyRatios: AtalanyCostRatio[] = [45, 80, 90]

const isTaxForm = (value: unknown): value is TaxForm =>
  value === 'kata' || value === 'atalany' || value === 'custom'

const isAtalanyCostRatio = (value: unknown): value is AtalanyCostRatio =>
  value === 45 || value === 80 || value === 90

const isAtalanyStatus = (value: unknown): value is AtalanyStatus =>
  value === 'main' || value === 'side'

const isAtalanyWageBase = (value: unknown): value is AtalanyWageBase =>
  value === 'minimum' || value === 'skilled'

const parseAtalanyCostRatio = (value: unknown): AtalanyCostRatio => {
  const ratio = Number(value)
  if (ratio === 40 || ratio === 45) return 45
  return isAtalanyCostRatio(ratio) ? ratio : 80
}

const familyChildOptions = [0, 1, 2, 3, 4] as const

const familyMonthlyTaxBase = (children: number) => {
  if (children <= 0) return 0
  if (children === 1) return 133_340
  if (children === 2) return 266_660 * 2
  return 440_000 * Math.min(4, children)
}

const familyMonthlySaving = (children: number) =>
  familyMonthlyTaxBase(children) * ATALANY_SZJA_RATE

const parseFamilyChildren = (value: unknown) => {
  const children = Math.floor(Number(value))
  if (!Number.isInteger(children) || children < 0) return 0
  return Math.min(4, children)
}

const atalanyIncomeShare = (costRatio: number) =>
  1 - Math.min(90, Math.max(45, costRatio)) / 100

const atalanyWageMonthly = (tax: TaxSettings) =>
  tax.atalanyWageBase === 'minimum' ? MIN_WAGE_MONTHLY : SKILLED_WAGE_MONTHLY

const atalanyTaxFreeRevenue = (costRatio: number) => {
  const share = atalanyIncomeShare(costRatio)
  return share > 0 ? ATALANY_TAX_FREE_INCOME / share : 0
}

const atalanySzjaFreeExtra = (tax: TaxSettings) =>
  tax.under25 ? UNDER25_ANNUAL : 0

const atalanySzjaFreeRevenue = (tax: TaxSettings) => {
  const share = atalanyIncomeShare(tax.atalanyCostRatio)
  const income = ATALANY_TAX_FREE_INCOME + atalanySzjaFreeExtra(tax)
  return share > 0 ? income / share : 0
}

const atalanyMinMonthlyContrib = (tax: TaxSettings) =>
  tax.atalanyStatus === 'main'
    ? atalanyWageMonthly(tax) * ATALANY_CONTRIB_RATE
    : 0

const atalanyTaxForIncome = (income: number, tax: TaxSettings) => {
  const I = Math.max(0, income)
  const taxable = Math.max(0, I - ATALANY_TAX_FREE_INCOME)
  const szjaBase = Math.max(0, taxable - atalanySzjaFreeExtra(tax))
  const familyBase = familyMonthlyTaxBase(tax.familyChildren) * 12
  const szja = ATALANY_SZJA_RATE * Math.max(0, szjaBase - familyBase)
  const familyTbCredit = ATALANY_SZJA_RATE * Math.max(0, familyBase - szjaBase)
  const isMain = tax.atalanyStatus === 'main'
  const minBase = isMain ? atalanyWageMonthly(tax) * 12 : 0
  const contribBase = Math.max(minBase, taxable)
  const rawTb = ATALANY_TB_RATE * contribBase
  const szocho = ATALANY_SZOCHO_RATE * contribBase
  const tbCreditCap =
    ATALANY_TB_RATE * (isMain ? Math.min(Math.max(I, taxable), contribBase) : taxable)
  const tb = Math.max(0, rawTb - Math.min(familyTbCredit, tbCreditCap))
  return szja + tb + szocho
}

const atalanyNeededRevenue = (costs: number, tax: TaxSettings) => {
  const base = Math.max(0, costs)
  const share = atalanyIncomeShare(tax.atalanyCostRatio)
  if (!(share > 0)) return base + atalanyMinMonthlyContrib(tax) * 12

  let low = base
  let high = Math.max(base + 1, base * 2 + 12_000_000)
  const netOf = (revenue: number) =>
    revenue - atalanyTaxForIncome(revenue * share, tax)

  for (let step = 0; step < 8 && netOf(high) < base; step += 1) {
    high *= 2
  }
  for (let step = 0; step < 48; step += 1) {
    const mid = (low + high) / 2
    if (netOf(mid) >= base) high = mid
    else low = mid
  }
  return high
}

const annualTaxOnBase = (baseAnnual: number, tax: TaxSettings) => {
  if (tax.form === 'kata') return Math.max(0, tax.kataMonthly) * 12
  if (tax.form === 'custom') return Math.max(0, tax.customMonthly) * 12
  return Math.max(
    0,
    atalanyNeededRevenue(baseAnnual, tax) - Math.max(0, baseAnnual),
  )
}

type WorkSettings = {
  workdays: number
  vacation: number
  education: number
  hoursPerDay: number
  occupancy: number
}

type TeamMember = {
  id: number
  name: string
  work: WorkSettings
  costs: Cost[]
  salonShare: number | null
  payMode: PayMode
  commissionPercent: number
  commissionAfterMaterials: boolean
  monthlyProduction: number
}

const multipliers: Record<Period, number> = {
  month: 12,
  quarter: 4,
  halfyear: 2,
  year: 1,
}

const periodLabels: Record<Period, string> = {
  month: '/ hó',
  quarter: '/ negyedév',
  halfyear: '/ félév',
  year: '/ év',
}

const pricingCostHint =
  'Az ajánlott ár a két sor összegének változásából jön. Ha csak az anyagot töltöd ki, túl sokat emelsz.'

const soloCostTemplates: CostTemplate[] = [
  { name: 'Fizetés igényem', period: 'month', amount: 0 },
  { name: 'Járulék', period: 'month', amount: 0 },
  { name: 'Nyugdíj-előtakarékosság', period: 'month', amount: 0 },
  { name: 'Egészség- és életbiztosítás', period: 'month', amount: 0 },
  { name: 'Betegség pénzügyi tartaléka', period: 'month', amount: 0 },
  { name: 'Szakmai rendezvények', period: 'year', amount: 0 },
  { name: 'Szakmai előfizetések', period: 'month', amount: 0 },
  { name: 'Bérleti díj', period: 'month', amount: 0 },
  { name: 'Közös költség', period: 'month', amount: 0 },
  { name: 'Villany', period: 'month', amount: 0 },
  { name: 'Víz és csatorna', period: 'month', amount: 0 },
  { name: 'Fűtés és gáz', period: 'month', amount: 0 },
  { name: 'Internet és telefon', period: 'month', amount: 0 },
  { name: 'Könyvelő', period: 'month', amount: 0 },
  { name: 'Bankköltség és termináldíj', period: 'month', amount: 0 },
  { name: 'Biztosítás', period: 'year', amount: 0 },
  { name: 'Iparűzési adó', period: 'year', amount: 0 },
  { name: 'Kamarai hozzájárulás', period: 'year', amount: 0 },
  { name: 'Fertőtlenítő- és tisztítószerek', period: 'month', amount: 0 },
  { name: 'Textil, mosás és munkaruha', period: 'month', amount: 0 },
  { name: 'Hulladék elszállítása', period: 'month', amount: 0 },
  { name: 'Marketing és hirdetések', period: 'month', amount: 0 },
  { name: 'Weboldal és domain', period: 'year', amount: 0 },
  { name: 'Időpontfoglaló és szoftverek', period: 'month', amount: 0 },
  { name: 'Karbantartás és javítás', period: 'quarter', amount: 0 },
  { name: 'Oktatás és továbbképzés', period: 'year', amount: 0 },
  { name: 'Utazás és parkolás', period: 'month', amount: 0 },
]

const teamCostTemplates: CostTemplate[] = [
  { name: 'Bérleti díj', period: 'month', amount: 0 },
  { name: 'Közös költség', period: 'month', amount: 0 },
  { name: 'Villany', period: 'month', amount: 0 },
  { name: 'Víz és csatorna', period: 'month', amount: 0 },
  { name: 'Fűtés és gáz', period: 'month', amount: 0 },
  { name: 'Internet és telefon', period: 'month', amount: 0 },
  { name: 'Könyvelő', period: 'month', amount: 0 },
  { name: 'Bankköltség és termináldíj', period: 'month', amount: 0 },
  { name: 'Biztosítás', period: 'year', amount: 0 },
  { name: 'Iparűzési adó', period: 'year', amount: 0 },
  { name: 'Takarítás', period: 'month', amount: 0 },
  { name: 'Mosás és textilcsere', period: 'month', amount: 0 },
  { name: 'Hulladék elszállítása', period: 'month', amount: 0 },
  { name: 'Közös fogyóanyagok', period: 'month', amount: 0 },
  { name: 'Karbantartás és javítás', period: 'quarter', amount: 0 },
  { name: 'Marketing és hirdetések', period: 'month', amount: 0 },
  { name: 'Weboldal és domain', period: 'year', amount: 0 },
  { name: 'Időpontfoglaló és szoftverek', period: 'month', amount: 0 },
  { name: 'Riasztó és biztonságtechnika', period: 'month', amount: 0 },
  { name: 'Zene- és egyéb jogdíjak', period: 'year', amount: 0 },
]

const teamStaffCostTemplates: CostTemplate[] = [
  { name: 'Recepciós bére', period: 'month', amount: 0 },
  { name: 'Recepciós járuléka', period: 'month', amount: 0 },
  { name: 'Marketinges bére', period: 'month', amount: 0 },
  { name: 'Marketinges járuléka', period: 'month', amount: 0 },
]

const ownerCostTemplates: CostTemplate[] = [
  { name: 'Fizetés igényem', period: 'month', amount: 0 },
  { name: 'Járulék', period: 'month', amount: 0 },
  { name: 'Munkába járás költsége', period: 'month', amount: 0 },
  { name: 'Telefon és internet', period: 'month', amount: 0 },
  { name: 'Oktatás és továbbképzés', period: 'year', amount: 0 },
  { name: 'Szakmai rendezvények', period: 'year', amount: 0 },
  { name: 'Szakmai előfizetések', period: 'month', amount: 0 },
  { name: 'Nyugdíj-előtakarékosság', period: 'month', amount: 0 },
  { name: 'Egészség- és életbiztosítás', period: 'month', amount: 0 },
  { name: 'Betegség pénzügyi tartaléka', period: 'month', amount: 0 },
]

const employeeCostTemplates: CostTemplate[] = [
  { name: 'Fizetés', period: 'month', amount: 0 },
  { name: 'Járulék', period: 'month', amount: 0 },
  { name: 'Bónusz és jutalék', period: 'month', amount: 0 },
  { name: 'Cafeteria', period: 'month', amount: 0 },
  { name: 'Munkába járás térítése', period: 'month', amount: 0 },
  { name: 'Munkaruha', period: 'year', amount: 0 },
  { name: 'Oktatás és továbbképzés', period: 'year', amount: 0 },
  { name: 'Foglalkozás-egészségügy', period: 'year', amount: 0 },
  { name: 'Betegszabadság tartaléka', period: 'month', amount: 0 },
  { name: 'Munkaeszközök és fogyóanyagok', period: 'month', amount: 0 },
  { name: 'Haszon a munkatárson', period: 'month', amount: 0 },
]

let nextCostId = 100

const createCosts = (templates: CostTemplate[]): Cost[] =>
  templates.map((template) => ({
    id: nextCostId++,
    ...template,
  }))

const initialWork: WorkSettings = {
  workdays: 0,
  vacation: 0,
  education: 0,
  hoursPerDay: 0,
  occupancy: 100,
}

let nextEmployeeId = 1

const createEmployee = (index: number): TeamMember => ({
  id: nextEmployeeId++,
  name: `Munkatárs ${index}`,
  work: { ...initialWork },
  costs: createCosts(employeeCostTemplates),
  salonShare: null,
  payMode: 'salary',
  commissionPercent: 50,
  commissionAfterMaterials: true,
  monthlyProduction: 0,
})

type ServiceItem = {
  id: number
  name: string
  minutes: number
  materialCost: number
  newMaterialCost: number
  currentPrices: Record<string, number>
}

type ServicePreset = {
  name: string
  minutes: number
}

let nextServiceId = 1

const allocateServiceId = (usedIds: number[] = []) => {
  const id = Math.max(nextServiceId, ...usedIds, 0) + 1
  nextServiceId = id + 1
  return id
}

const emptyService = (usedIds: number[] = []): ServiceItem => ({
  id: allocateServiceId(usedIds),
  name: '',
  minutes: 0,
  materialCost: 0,
  newMaterialCost: 0,
  currentPrices: {},
})

const servicePresets: ServicePreset[] = [
  { name: 'Női hajvágás', minutes: 60 },
  { name: 'Férfi hajvágás', minutes: 30 },
  { name: 'Gyermek hajvágás', minutes: 30 },
  { name: 'Hajfestés', minutes: 90 },
  { name: 'Melír', minutes: 120 },
  { name: 'Balayage', minutes: 150 },
  { name: 'Hajszárítás', minutes: 20 },
  { name: 'Konty / alkalmi frizura', minutes: 45 },
]

const PRICE_GAP_THRESHOLD_HUF = 1

const pricelistPersonKey = (
  source: PricelistSource,
  employeeId: number,
) => (source === 'employee' ? `employee:${employeeId}` : source)

const isPricelistPersonKey = (key: string) =>
  key === 'solo' || key === 'owner' || /^employee:\d+$/.test(key)

const currentServicePrice = (service: ServiceItem, personKey: string) =>
  service.currentPrices[personKey] ?? 0

const isBlankService = (service: ServiceItem) =>
  !service.name.trim() &&
  service.minutes <= 0 &&
  service.materialCost <= 0 &&
  service.newMaterialCost <= 0 &&
  Object.values(service.currentPrices).every((amount) => amount <= 0)

const withTrailingEmpty = (services: ServiceItem[]) => {
  const filled = services.filter((service) => !isBlankService(service))
  const trailingBlank = [...services].reverse().find(isBlankService)
  const next = trailingBlank ? [...filled, trailingBlank] : filled
  if (next.length === 0) return [emptyService()]
  if (isBlankService(next[next.length - 1])) return next
  return [...next, emptyService(next.map((service) => service.id))]
}

const serviceLaborCost = (hourlyRate: number, minutes: number) =>
  hourlyRate > 0 && minutes > 0 ? (hourlyRate * minutes) / 60 : 0

const recommendedMaterialCost = (service: ServiceItem) =>
  service.newMaterialCost > 0 ? service.newMaterialCost : service.materialCost

const recommendedServicePrice = (
  hourlyRate: number,
  minutes: number,
  materialCost = 0,
) => {
  const labor = serviceLaborCost(hourlyRate, minutes)
  return labor ? labor + materialCost : 0
}

type PriceGapTone = 'behind' | 'ahead'

const priceGapTone = (
  currentPrice: number,
  recommended: number,
): PriceGapTone | null => {
  if (!currentPrice || !recommended) return null
  if (currentPrice >= recommended) return 'ahead'
  if (recommended - currentPrice >= PRICE_GAP_THRESHOLD_HUF) return 'behind'
  return null
}

const STORAGE_KEY = 'armuhely.calculator.v1'
const STORAGE_VERSION = 1

type InvestmentSettings = {
  renovationYears: number
  renovationAmount: number
  equipmentYears: number
  equipmentAmount: number
}

type PricingSettings = {
  previousMaterials: number
  currentMaterials: number
  previousOther: number
  currentOther: number
  currentServicePrice: number
}

type PersistedCalculator = {
  version: number
  activeTab: TabId
  language: Language
  currency: Currency
  soloWork: WorkSettings
  ownerWork: WorkSettings
  employees: TeamMember[]
  activeEmployeeId: number
  soloCosts: Cost[]
  teamCosts: Cost[]
  teamStaffCosts: Cost[]
  ownerCosts: Cost[]
  teamSize: number
  soloInvestment: InvestmentSettings
  teamInvestment: InvestmentSettings
  ownerSalonShare: number | null
  pricing: PricingSettings
  pricelistSource: PricelistSource
  pricelistEmployeeId: number
  services: ServiceItem[]
  soloTax: TaxSettings
  ownerTax: TaxSettings
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isPeriod = (value: unknown): value is Period =>
  value === 'month' ||
  value === 'quarter' ||
  value === 'halfyear' ||
  value === 'year'

const isTabId = (value: unknown): value is TabId =>
  value === 'solo' ||
  value === 'team' ||
  value === 'owner' ||
  value === 'employee' ||
  value === 'pricing' ||
  value === 'pricelist'

const isPricelistSource = (value: unknown): value is PricelistSource =>
  value === 'solo' || value === 'owner' || value === 'employee'

const isLanguage = (value: unknown): value is Language =>
  value === 'hu' || value === 'en' || value === 'cs' || value === 'sk'

const isCurrency = (value: unknown): value is Currency =>
  value === 'HUF' || value === 'EUR' || value === 'CZK'

const parseAmount = (value: unknown) => {
  const amount = Number(value)
  return Number.isFinite(amount) && amount >= 0 ? amount : 0
}

const parseCost = (value: unknown): Cost | null => {
  if (
    !isRecord(value) ||
    typeof value.name !== 'string' ||
    !isPeriod(value.period)
  ) {
    return null
  }
  const id = Number(value.id)
  if (!Number.isInteger(id) || id < 0) return null
  return {
    id,
    name: value.name,
    period: value.period,
    amount: parseAmount(value.amount),
  }
}

const parseCosts = (value: unknown): Cost[] | null => {
  if (!Array.isArray(value)) return null
  const costs: Cost[] = []
  for (const item of value) {
    const cost = parseCost(item)
    if (!cost) return null
    costs.push(cost)
  }
  return costs
}

const parseWork = (value: unknown): WorkSettings | null => {
  if (!isRecord(value)) return null
  return {
    workdays: parseAmount(value.workdays),
    vacation: parseAmount(value.vacation),
    education: parseAmount(value.education),
    hoursPerDay: parseAmount(value.hoursPerDay),
    occupancy:
      value.occupancy === undefined
        ? 100
        : Math.min(100, Math.max(1, parseAmount(value.occupancy) || 100)),
  }
}

const parseInvestment = (value: unknown): InvestmentSettings | null => {
  if (!isRecord(value)) return null
  return {
    renovationYears: parseAmount(value.renovationYears),
    renovationAmount: parseAmount(value.renovationAmount),
    equipmentYears: parseAmount(value.equipmentYears),
    equipmentAmount: parseAmount(value.equipmentAmount),
  }
}

const parsePricing = (value: unknown): PricingSettings | null => {
  if (!isRecord(value)) return null
  return {
    previousMaterials: parseAmount(value.previousMaterials),
    currentMaterials: parseAmount(value.currentMaterials),
    previousOther: parseAmount(value.previousOther),
    currentOther: parseAmount(value.currentOther),
    currentServicePrice: parseAmount(value.currentServicePrice),
  }
}

const parseTaxSettings = (value: unknown): TaxSettings => {
  if (!isRecord(value)) return { ...initialTax }
  return {
    form: isTaxForm(value.form) ? value.form : 'kata',
    kataMonthly: parseAmount(value.kataMonthly),
    atalanyCostRatio: parseAtalanyCostRatio(value.atalanyCostRatio),
    atalanyStatus: isAtalanyStatus(value.atalanyStatus)
      ? value.atalanyStatus
      : 'main',
    atalanyWageBase: isAtalanyWageBase(value.atalanyWageBase)
      ? value.atalanyWageBase
      : 'skilled',
    under25: value.under25 === true,
    familyChildren: parseFamilyChildren(value.familyChildren),
    customMonthly: parseAmount(value.customMonthly),
  }
}

const parseCurrentPrices = (
  value: unknown,
  fallbackPrice: number,
  fallbackKey: string,
): Record<string, number> => {
  const prices: Record<string, number> = {}
  if (isRecord(value)) {
    for (const [key, amount] of Object.entries(value)) {
      if (!isPricelistPersonKey(key)) continue
      const parsed = parseAmount(amount)
      if (parsed > 0) prices[key] = parsed
    }
  }
  if (Object.keys(prices).length > 0) return prices
  return fallbackPrice > 0 ? { [fallbackKey]: fallbackPrice } : {}
}

const parseService = (
  value: unknown,
  fallbackKey: string,
): ServiceItem | null => {
  if (!isRecord(value) || typeof value.name !== 'string') return null
  const id = Number(value.id)
  if (!Number.isInteger(id) || id < 0) return null
  return {
    id,
    name: value.name,
    minutes: parseAmount(value.minutes),
    materialCost: parseAmount(value.materialCost),
    newMaterialCost: parseAmount(value.newMaterialCost),
    currentPrices: parseCurrentPrices(
      value.currentPrices,
      parseAmount(value.currentPrice),
      fallbackKey,
    ),
  }
}

const parseServices = (
  value: unknown,
  fallbackKey: string,
): ServiceItem[] | null => {
  if (value === undefined) return null
  if (!Array.isArray(value)) return null
  const services: ServiceItem[] = []
  for (const item of value) {
    const service = parseService(item, fallbackKey)
    if (service) services.push(service)
  }
  return services
}

const pruneEmployeeServicePrices = (
  services: ServiceItem[],
  employeeId: number,
) => {
  const removedKey = `employee:${employeeId}`
  return services.map((service) => {
    if (!(removedKey in service.currentPrices)) return service
    const currentPrices = { ...service.currentPrices }
    delete currentPrices[removedKey]
    return { ...service, currentPrices }
  })
}

const droppedCostKeys = ['toborzás és betanítás', 'anyagköltség']

const withoutDroppedCosts = (costs: Cost[]) =>
  costs.filter(
    (cost) =>
      !droppedCostKeys.includes(translate('hu', cost.name).trim().toLowerCase()),
  )

const parseEmployee = (value: unknown): TeamMember | null => {
  if (!isRecord(value) || typeof value.name !== 'string') return null
  const id = Number(value.id)
  if (!Number.isInteger(id) || id < 0) return null
  const work = parseWork(value.work)
  const costs = parseCosts(value.costs)
  if (!work || !costs) return null
  const salonShare =
    value.salonShare === null || value.salonShare === undefined
      ? null
      : parseAmount(value.salonShare)
  return {
    id,
    name: value.name,
    work,
    costs: withoutDroppedCosts(costs),
    salonShare,
    payMode: value.payMode === 'percent' ? 'percent' : 'salary',
    commissionPercent:
      value.commissionPercent === undefined
        ? 50
        : Math.min(90, Math.max(0, parseAmount(value.commissionPercent))),
    commissionAfterMaterials: value.commissionAfterMaterials !== false,
    monthlyProduction: parseAmount(value.monthlyProduction),
  }
}

const parsePersistedCalculator = (
  value: unknown,
): PersistedCalculator | null => {
  if (!isRecord(value) || value.version !== STORAGE_VERSION) return null
  if (
    !isTabId(value.activeTab) ||
    !isLanguage(value.language) ||
    !isCurrency(value.currency)
  ) {
    return null
  }
  const soloWork = parseWork(value.soloWork)
  const ownerWork = parseWork(value.ownerWork)
  const soloCosts = parseCosts(value.soloCosts)
  const teamCosts = parseCosts(value.teamCosts)
  const teamStaffCosts = parseCosts(value.teamStaffCosts)
  const ownerCosts = parseCosts(value.ownerCosts)
  const soloInvestment = parseInvestment(value.soloInvestment)
  const teamInvestment = parseInvestment(value.teamInvestment)
  const pricing = parsePricing(value.pricing)
  if (
    !soloWork ||
    !ownerWork ||
    !soloCosts ||
    !teamCosts ||
    !teamStaffCosts ||
    !ownerCosts ||
    !soloInvestment ||
    !teamInvestment ||
    !pricing ||
    !Array.isArray(value.employees)
  ) {
    return null
  }
  const employees: TeamMember[] = []
  for (const item of value.employees) {
    const member = parseEmployee(item)
    if (!member) return null
    employees.push(member)
  }
  if (employees.length === 0) return null
  const activeEmployeeId = Number(value.activeEmployeeId)
  if (!Number.isInteger(activeEmployeeId)) return null
  const resolvedEmployeeId = employees.some(
    (member) => member.id === activeEmployeeId,
  )
    ? activeEmployeeId
    : employees[0].id
  const ownerSalonShare =
    value.ownerSalonShare === null || value.ownerSalonShare === undefined
      ? null
      : parseAmount(value.ownerSalonShare)
  const pricelistSource = isPricelistSource(value.pricelistSource)
    ? value.pricelistSource
    : 'solo'
  const pricelistEmployeeId = Number.isInteger(Number(value.pricelistEmployeeId))
    ? Number(value.pricelistEmployeeId)
    : resolvedEmployeeId
  return {
    version: STORAGE_VERSION,
    activeTab: value.activeTab,
    language: value.language,
    currency: value.currency,
    soloWork,
    ownerWork,
    employees,
    activeEmployeeId: resolvedEmployeeId,
    soloCosts: withoutDroppedCosts(soloCosts),
    teamCosts: withoutDroppedCosts(teamCosts),
    teamStaffCosts: withoutDroppedCosts(teamStaffCosts),
    ownerCosts: withoutDroppedCosts(ownerCosts),
    teamSize: parseAmount(value.teamSize),
    soloInvestment,
    teamInvestment,
    ownerSalonShare,
    pricing,
    pricelistSource,
    pricelistEmployeeId,
    services:
      parseServices(
        value.services,
        pricelistPersonKey(pricelistSource, pricelistEmployeeId),
      ) ?? [],
    soloTax: parseTaxSettings(value.soloTax),
    ownerTax: parseTaxSettings(value.ownerTax),
  }
}

const readPersistedCalculator = (): PersistedCalculator | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return parsePersistedCalculator(JSON.parse(raw) as unknown)
  } catch {
    return null
  }
}

const writePersistedCalculator = (snapshot: PersistedCalculator) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    return
  }
}

const adoptIdCounters = (snapshot: PersistedCalculator) => {
  const costIds = [
    ...snapshot.soloCosts,
    ...snapshot.teamCosts,
    ...snapshot.teamStaffCosts,
    ...snapshot.ownerCosts,
    ...snapshot.employees.flatMap((member) => member.costs),
  ].map((cost) => cost.id)
  nextCostId = Math.max(nextCostId, ...costIds, 99) + 1
  nextEmployeeId =
    Math.max(
      nextEmployeeId,
      ...snapshot.employees.map((member) => member.id),
      0,
    ) + 1
  nextServiceId =
    Math.max(nextServiceId, ...snapshot.services.map((service) => service.id), 0) +
    1
}

const employeeProfitNames = [
  'haszon a munkatárson',
  'alkalmazottanként + bevétel',
]

const tabs: Array<{
  id: TabId
  label: string
  shortLabel: string
  description: string
  icon: typeof UserRound
}> = [
  {
    id: 'solo',
    label: 'Egyszemélyes szalon',
    shortLabel: 'Egyéni',
    description: 'A teljes vállalkozás fenntartható óradíja',
    icon: UserRound,
  },
  {
    id: 'team',
    label: 'Többszemélyes szalon',
    shortLabel: 'Szalon',
    description: 'Közös költségek igazságos felosztása',
    icon: UsersRound,
  },
  {
    id: 'owner',
    label: 'Saját órabérem',
    shortLabel: 'Saját bér',
    description: 'Tulajdonosi céljövedelem és személyes kiadások',
    icon: CircleDollarSign,
  },
  {
    id: 'employee',
    label: 'Munkatárs órabére',
    shortLabel: 'Munkatárs',
    description: 'A munkatársak kitermelendő költsége',
    icon: BriefcaseBusiness,
  },
  {
    id: 'pricing',
    label: 'Áremelés tervező',
    shortLabel: 'Áremelés',
    description: 'Költségváltozásból ajánlott korrekció',
    icon: TrendingUp,
  },
  {
    id: 'pricelist',
    label: 'Árlista',
    shortLabel: 'Árlista',
    description: 'Az óradíjadból kiszámolt szolgáltatási árak',
    icon: Tags,
  },
]

const navigationGroups: Array<{
  id: 'solo' | 'team' | 'pricing'
  label: string
  tabIds: TabId[]
}> = [
  {
    id: 'solo',
    label: 'Egyéni működés',
    tabIds: ['solo'],
  },
  {
    id: 'team',
    label: 'Többszemélyes működés',
    tabIds: ['team', 'owner', 'employee'],
  },
  {
    id: 'pricing',
    label: 'Árazás',
    tabIds: ['pricing', 'pricelist'],
  },
]

const annualTotal = (costs: Cost[]) =>
  costs.reduce((sum, cost) => sum + cost.amount * multipliers[cost.period], 0)

const workDays = (work: WorkSettings) =>
  Math.max(0, work.workdays - work.vacation - work.education)

const occupancyRatio = (work: WorkSettings) => {
  const occupancy = work.occupancy
  if (!Number.isFinite(occupancy) || occupancy <= 0) return 1
  return Math.min(100, occupancy) / 100
}

const billableHours = (work: WorkSettings) =>
  workDays(work) * work.hoursPerDay * occupancyRatio(work)

const wageReplacedCostKeys = [
  'fizetés',
  'bónusz és jutalék',
  'haszon a munkatárson',
]

const isWageReplacedCost = (cost: Cost) =>
  wageReplacedCostKeys.includes(translate('hu', cost.name).trim().toLowerCase())

const annualCostsForPayMode = (member: TeamMember) =>
  member.payMode === 'percent'
    ? annualTotal(member.costs.filter((cost) => !isWageReplacedCost(cost)))
    : annualTotal(member.costs)

const MAX_COMMISSION_PERCENT = 90

const commissionRatio = (member: TeamMember) => {
  if (member.payMode !== 'percent') return 0
  return (
    Math.min(MAX_COMMISSION_PERCENT, Math.max(0, member.commissionPercent)) /
    100
  )
}

const memberProductionHourly = (member: TeamMember) => {
  const hours = billableHours(member.work)
  if (!hours || member.monthlyProduction <= 0) return 0
  return (member.monthlyProduction * 12) / hours
}

const memberServiceHourly = (member: TeamMember, teamPerPerson: number) => {
  if (member.payMode === 'percent') return memberProductionHourly(member)
  const hours = billableHours(member.work)
  if (!hours) return 0
  const annual =
    (member.salonShare ?? teamPerPerson) + annualCostsForPayMode(member)
  return annual / hours
}

const memberMaterialFactor = (_member: TeamMember) => 1

const visibleEmployeeCosts = (member: TeamMember) =>
  member.payMode === 'percent'
    ? member.costs.filter((cost) => !isWageReplacedCost(cost))
    : member.costs

const mergeEmployeeCosts = (member: TeamMember, visible: Cost[]) => {
  if (member.payMode !== 'percent') return visible
  let index = 0
  const next: Cost[] = []
  for (const cost of member.costs) {
    if (isWageReplacedCost(cost)) next.push(cost)
    else if (index < visible.length) next.push(visible[index++])
  }
  return [...next, ...visible.slice(index)]
}

const selectedAnnualTotal = (costs: Cost[], names: string[]) =>
  costs
    .filter((cost) =>
      names.includes(translate('hu', cost.name).trim().toLowerCase()),
    )
    .reduce((sum, cost) => sum + cost.amount * multipliers[cost.period], 0)

const memberStaffProfit = (member: TeamMember, teamPerPerson: number) => {
  if (member.payMode !== 'percent') {
    return selectedAnnualTotal(member.costs, employeeProfitNames)
  }
  if (member.monthlyProduction <= 0) return 0
  const remainder =
    member.monthlyProduction * 12 * (1 - commissionRatio(member))
  const costs =
    (member.salonShare ?? teamPerPerson) + annualCostsForPayMode(member)
  return remainder - costs
}

const currentCalendarYear = () =>
  Number(
    new Intl.DateTimeFormat('hu-HU', {
      timeZone: 'Europe/Budapest',
      year: 'numeric',
    }).format(new Date()),
  )

const addCalendarDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const easterSunday = (year: number) => {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

const hungarianPublicHolidays = (year: number) => {
  const easter = easterSunday(year)
  return [
    new Date(year, 0, 1),
    new Date(year, 2, 15),
    addCalendarDays(easter, -2),
    addCalendarDays(easter, 1),
    new Date(year, 4, 1),
    addCalendarDays(easter, 50),
    new Date(year, 7, 20),
    new Date(year, 9, 23),
    new Date(year, 10, 1),
    new Date(year, 11, 25),
    new Date(year, 11, 26),
  ]
}

const czechPublicHolidays = (year: number) => {
  const easter = easterSunday(year)
  return [
    new Date(year, 0, 1),
    addCalendarDays(easter, -2),
    addCalendarDays(easter, 1),
    new Date(year, 4, 1),
    new Date(year, 4, 8),
    new Date(year, 6, 5),
    new Date(year, 6, 6),
    new Date(year, 8, 28),
    new Date(year, 9, 28),
    new Date(year, 10, 17),
    new Date(year, 11, 24),
    new Date(year, 11, 25),
    new Date(year, 11, 26),
  ]
}

const dateKey = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

const workdaysExcludingHolidays = (year: number, holidays: Date[]) => {
  const holidayKeys = new Set(holidays.map(dateKey))
  let workdays = 0

  for (let month = 0; month < 12; month += 1) {
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day)
      const weekday = date.getDay()
      if (weekday === 0 || weekday === 6) continue
      if (holidayKeys.has(dateKey(date))) continue
      workdays += 1
    }
  }

  return workdays
}

const hungarianWorkdaysInYear = (year: number) =>
  workdaysExcludingHolidays(year, hungarianPublicHolidays(year))

const czechWorkdaysInYear = (year: number) =>
  workdaysExcludingHolidays(year, czechPublicHolidays(year))

const slovakPublicHolidays = (year: number) => {
  const easter = easterSunday(year)
  return [
    new Date(year, 0, 1),
    new Date(year, 0, 6),
    addCalendarDays(easter, -2),
    addCalendarDays(easter, 1),
    new Date(year, 4, 1),
    new Date(year, 4, 8),
    new Date(year, 6, 5),
    new Date(year, 7, 29),
    new Date(year, 8, 1),
    new Date(year, 8, 15),
    new Date(year, 10, 1),
    new Date(year, 10, 17),
    new Date(year, 11, 24),
    new Date(year, 11, 25),
    new Date(year, 11, 26),
  ]
}

const slovakWorkdaysInYear = (year: number) =>
  workdaysExcludingHolidays(year, slovakPublicHolidays(year))

const yearInessive = (year: number) => {
  const lastDigit = year % 10
  const frontVowel = [1, 2, 4, 5, 7, 9].includes(lastDigit)
  return `${year}-${frontVowel ? 'ben' : 'ban'}`
}

const yearAdjective = (year: number) => {
  const lastDigit = year % 10
  const suffix =
    lastDigit === 5
      ? 'ös'
      : lastDigit === 6
        ? 'os'
        : lastDigit === 0 || lastDigit === 3 || lastDigit === 8
          ? 'as'
          : 'es'
  return `${year}-${suffix}`
}

const currencySuffix = (currency: Currency) => {
  if (currency === 'EUR') return '€'
  if (currency === 'CZK') return 'Kč'
  return 'Ft'
}

const toDisplayCurrency = (
  value: number,
  currency: Currency,
  rates: FxRates,
) => {
  if (currency === 'EUR') return value / rates.hufPerEur
  if (currency === 'CZK') return value / rates.hufPerCzk
  return value
}

const fromDisplayCurrency = (
  value: number,
  currency: Currency,
  rates: FxRates,
) => {
  if (currency === 'EUR') return value * rates.hufPerEur
  if (currency === 'CZK') return value * rates.hufPerCzk
  return value
}

const displayRoundingStep = (currency: Currency) => {
  if (currency === 'EUR') return 1
  if (currency === 'CZK') return 10
  return 100
}

const roundDisplayedPrice = (
  value: number,
  currency: Currency,
  rates: FxRates,
) => {
  if (!value) return 0
  const display = toDisplayCurrency(value, currency, rates)
  const step = displayRoundingStep(currency)
  const rounded = Math.ceil(display / step - 1e-9) * step
  return fromDisplayCurrency(rounded, currency, rates)
}

const formatMoney = (
  value: number,
  language: Language,
  currency: Currency,
  rates: FxRates,
) =>
  new Intl.NumberFormat(localeTag(language), {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'EUR' ? 2 : 0,
  }).format(toDisplayCurrency(value, currency, rates))

const formatLocalizedNumber = (value: number, language: Language) =>
  Math.round(value).toLocaleString(localeTag(language))

const localeTag = (language: Language) => {
  if (language === 'hu') return 'hu-HU'
  if (language === 'cs') return 'cs-CZ'
  if (language === 'sk') return 'sk-SK'
  return 'en-GB'
}

const countDigits = (text: string) => (text.match(/\d/g) ?? []).length

const caretFromDigitCount = (text: string, digits: number) => {
  if (digits <= 0) return 0
  let seen = 0
  for (let index = 0; index < text.length; index += 1) {
    if (/\d/.test(text[index])) {
      seen += 1
      if (seen === digits) return index + 1
    }
  }
  return text.length
}

const formatGroupedAmount = (
  value: number,
  language: Language,
  allowDecimals: boolean,
) => {
  if (!value) return ''
  return new Intl.NumberFormat(localeTag(language), {
    useGrouping: true,
    maximumFractionDigits: allowDecimals ? 2 : 0,
    minimumFractionDigits: 0,
  }).format(value)
}

const parseGroupedAmount = (
  raw: string,
  language: Language,
  allowDecimals: boolean,
) => {
  if (!raw.trim()) return 0
  if (!allowDecimals) return Number(raw.replace(/\D/g, '')) || 0

  const decimalSeparator = language === 'en' ? '.' : ','
  const groupingSeparator =
    language === 'en' ? ',' : language === 'hu' ? '.' : ' '
  const normalized = raw
    .replace(/[\s\u00a0\u202f\u2009]/g, '')
    .replaceAll(groupingSeparator, '')
    .replace(decimalSeparator, '.')
    .replace(/[^\d.]/g, '')
  const firstDot = normalized.indexOf('.')
  const cleaned =
    firstDot === -1
      ? normalized
      : `${normalized.slice(0, firstDot + 1)}${normalized.slice(firstDot + 1).replaceAll('.', '')}`

  return Number(cleaned) || 0
}

function AmountInput({
  value,
  onChange,
  'aria-label': ariaLabel,
}: {
  value: number
  onChange: (value: number) => void
  'aria-label'?: string
}) {
  const { currency, language, hufPerEur, hufPerCzk } = useLocale()
  const rates = { hufPerEur, hufPerCzk }
  const allowDecimals = currency === 'EUR'
  const decimalSeparator = language === 'en' ? '.' : ','
  const displayValue = toDisplayCurrency(value, currency, rates)
  const formatted = formatGroupedAmount(displayValue, language, allowDecimals)
  const inputRef = useRef<HTMLInputElement>(null)
  const caretDigitsRef = useRef<number | null>(null)
  const caretAtEndRef = useRef(false)
  const [keepDecimalSeparator, setKeepDecimalSeparator] = useState(false)
  const shown =
    keepDecimalSeparator && allowDecimals
      ? `${formatted || '0'}${decimalSeparator}`
      : formatted

  useEffect(() => {
    setKeepDecimalSeparator(false)
  }, [currency, language])

  useLayoutEffect(() => {
    const input = inputRef.current
    if (!input || caretDigitsRef.current === null) return
    const position = caretAtEndRef.current
      ? shown.length
      : caretFromDigitCount(shown, caretDigitsRef.current)
    input.setSelectionRange(position, position)
    caretDigitsRef.current = null
    caretAtEndRef.current = false
  }, [shown])

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode={allowDecimals ? 'decimal' : 'numeric'}
      autoComplete="off"
      spellCheck={false}
      aria-label={ariaLabel}
      value={shown}
      onChange={(event) => {
        const raw = event.target.value
        const selection = event.target.selectionStart ?? raw.length
        caretDigitsRef.current = countDigits(raw.slice(0, selection))
        caretAtEndRef.current =
          allowDecimals && raw.trim().endsWith(decimalSeparator)
        setKeepDecimalSeparator(
          allowDecimals && raw.trim().endsWith(decimalSeparator),
        )
        onChange(
          fromDisplayCurrency(
            parseGroupedAmount(raw, language, allowDecimals),
            currency,
            rates,
          ),
        )
      }}
    />
  )
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
  hint,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  suffix?: string
  hint?: string
}) {
  const { currency, language } = useLocale()
  const isMoney = suffix === 'Ft'

  return (
    <label className="field">
      <span className="field-label">{translate(language, label)}</span>
      <span className="input-shell">
        {isMoney ? (
          <AmountInput value={value} onChange={onChange} />
        ) : (
          <input
            type="number"
            min="0"
            step="1"
            value={value || ''}
            onChange={(event) => onChange(Number(event.target.value) || 0)}
          />
        )}
        {suffix && (
          <span className="input-suffix">
            {isMoney ? currencySuffix(currency) : translate(language, suffix)}
          </span>
        )}
      </span>
      {hint && <span className="field-hint">{translate(language, hint)}</span>}
    </label>
  )
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const { language } = useLocale()

  return (
    <label className="field">
      <span className="field-label">{translate(language, label)}</span>
      <span className="input-shell plain">
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
    </label>
  )
}

function OccupancyField({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  const { language } = useLocale()
  const occupancy = Math.min(100, Math.max(1, value || 100))

  return (
    <label className="field occupancy-field">
      <span className="field-label">{translate(language, 'Kihasználtság')}</span>
      <span className="occupancy-slider">
        <input
          type="range"
          min={1}
          max={100}
          step={1}
          value={occupancy}
          aria-valuemin={1}
          aria-valuemax={100}
          aria-valuenow={occupancy}
          aria-valuetext={`${occupancy}%`}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <span className="occupancy-value">{occupancy}%</span>
      </span>
      <span className="field-hint">
        {translate(language, 'A naptár hány százaléka van tényleg tele.')}
      </span>
    </label>
  )
}

function WorkFields({
  value,
  onChange,
}: {
  value: WorkSettings
  onChange: (next: WorkSettings) => void
}) {
  const { language } = useLocale()
  const year = currentCalendarYear()
  const workdaysThisYear =
    language === 'cs'
      ? czechWorkdaysInYear(year)
      : language === 'sk'
        ? slovakWorkdaysInYear(year)
        : hungarianWorkdaysInYear(year)
  const workdayHint = textByLang(
    language,
    `${yearInessive(year)} ${workdaysThisYear} munkanap van.`,
    `There are ${workdaysThisYear} workdays in ${year}.`,
    `V roce ${year} je ${workdaysThisYear} pracovních dnů.`,
    `V roku ${year} je ${workdaysThisYear} pracovných dní.`,
  )
  const update = (key: keyof WorkSettings, fieldValue: number) =>
    onChange({ ...value, [key]: fieldValue })

  return (
    <div className="field-grid">
      <NumberField
        label="Munkanapok évente"
        value={value.workdays}
        onChange={(next) => update('workdays', next)}
        suffix="nap"
        hint={workdayHint}
      />
      <NumberField
        label="Szabadság"
        value={value.vacation}
        onChange={(next) => update('vacation', next)}
        suffix="nap"
      />
      <NumberField
        label="Oktatási napok"
        value={value.education}
        onChange={(next) => update('education', next)}
        suffix="nap"
      />
      <NumberField
        label="Munkaidő naponta"
        value={value.hoursPerDay}
        onChange={(next) => update('hoursPerDay', next)}
        suffix="óra"
      />
      <OccupancyField
        value={value.occupancy}
        onChange={(occupancy) => update('occupancy', occupancy)}
      />
    </div>
  )
}

const taxFormLabels: Record<TaxForm, string> = {
  kata: 'KATA',
  atalany: 'Átalányadó',
  custom: 'Egyéb',
}

function TaxEditor({
  value,
  onChange,
  baseAnnual,
}: {
  value: TaxSettings
  onChange: (next: TaxSettings) => void
  baseAnnual: number
}) {
  const { language, currency, hufPerEur, hufPerCzk } = useLocale()
  const t = (text: string) => translate(language, text)
  const taxAnnual = annualTaxOnBase(baseAnnual, value)
  const taxMonthly = taxAnnual / 12
  const neededAnnual = Math.max(0, baseAnnual) + taxAnnual
  const deemedCostMonthly =
    (neededAnnual * value.atalanyCostRatio) / 100 / 12
  const deemedIncomeMonthly =
    (neededAnnual * atalanyIncomeShare(value.atalanyCostRatio)) / 12
  const money = (amount: number) =>
    amount
      ? formatMoney(amount, language, currency, { hufPerEur, hufPerCzk })
      : '—'

  return (
    <>
      <div
        className="compact-switch pay-mode-switch"
        role="group"
        aria-label={t('Adózási forma')}
      >
        {(['kata', 'atalany', 'custom'] as TaxForm[]).map((form) => (
          <button
            type="button"
            className={value.form === form ? 'active' : ''}
            aria-pressed={value.form === form}
            onClick={() => onChange({ ...value, form })}
            key={form}
          >
            {t(taxFormLabels[form])}
          </button>
        ))}
      </div>
      {value.form === 'kata' && (
        <>
          <p className="panel-lead">
            {t(
              'Főállású katásként havonta 50.000 Ft, és kész. Az iparűzési adót a költségek között külön írd. A Járulék sort hagyd üresen, ha nincs más járulékod.',
            )}
          </p>
          <div className="tax-chips" role="group" aria-label={t('Havi KATA')}>
            <button
              type="button"
              className={value.kataMonthly === KATA_MONTHLY_HUF ? 'active' : ''}
              aria-pressed={value.kataMonthly === KATA_MONTHLY_HUF}
              onClick={() =>
                onChange({ ...value, kataMonthly: KATA_MONTHLY_HUF })
              }
            >
              {t('50.000 Ft')}
            </button>
          </div>
          <NumberField
            label="Havi KATA"
            value={value.kataMonthly}
            onChange={(kataMonthly) => onChange({ ...value, kataMonthly })}
            suffix="Ft"
          />
        </>
      )}
      {value.form === 'atalany' && (
        <>
          <p className="panel-lead">
            {t(
              'Az átalányjövedelem 2026-ban évi 1.936.800 Ft-ig SZJA-mentes, főállásban és mellékállásban is. Mellékállásban (heti 36 órás munka vagy nappali suli) eddig a bevételig TB és szocho sem kell. Főállásban a minimum járulék ettől függetlenül megvan. Ez tervezés, nem hivatalos bevallás.',
            )}
          </p>
          <div
            className="compact-switch pay-mode-switch"
            role="group"
            aria-label={t('Vállalkozói státusz')}
          >
            <button
              type="button"
              className={value.atalanyStatus !== 'side' ? 'active' : ''}
              aria-pressed={value.atalanyStatus !== 'side'}
              onClick={() => onChange({ ...value, atalanyStatus: 'main' })}
            >
              {t('Főállású')}
            </button>
            <button
              type="button"
              className={value.atalanyStatus === 'side' ? 'active' : ''}
              aria-pressed={value.atalanyStatus === 'side'}
              onClick={() => onChange({ ...value, atalanyStatus: 'side' })}
            >
              {t('Mellékállás')}
            </button>
          </div>
          <div
            className="compact-switch pay-mode-switch"
            role="group"
            aria-label={t('25 év alattiak kedvezménye')}
          >
            <button
              type="button"
              className={value.under25 ? 'active' : ''}
              aria-pressed={value.under25}
              onClick={() => onChange({ ...value, under25: true })}
            >
              {t('25 év alatt')}
            </button>
            <button
              type="button"
              className={!value.under25 ? 'active' : ''}
              aria-pressed={!value.under25}
              onClick={() => onChange({ ...value, under25: false })}
            >
              {t('25 betöltötte')}
            </button>
          </div>
          <div
            className="compact-switch pay-mode-switch"
            role="group"
            aria-label={t('Családi kedvezmény')}
          >
            {familyChildOptions.map((count) => (
              <button
                type="button"
                className={value.familyChildren === count ? 'active' : ''}
                aria-pressed={value.familyChildren === count}
                onClick={() => onChange({ ...value, familyChildren: count })}
                key={count}
              >
                {count === 0
                  ? t('Nincs gyerek')
                  : count === 4
                    ? '4+'
                    : String(count)}
              </button>
            ))}
          </div>
          <p className="field-hint">
            {t(
              'A családi kedvezmény először az SZJA-t viszi le. Ami megmarad, a TB-ből jön le, a szochóból nem.',
            )}
          </p>
          {value.atalanyStatus !== 'side' && (
            <div
              className="compact-switch pay-mode-switch"
              role="group"
              aria-label={t('Járulékalap')}
            >
              <button
                type="button"
                className={value.atalanyWageBase === 'minimum' ? 'active' : ''}
                aria-pressed={value.atalanyWageBase === 'minimum'}
                onClick={() =>
                  onChange({ ...value, atalanyWageBase: 'minimum' })
                }
              >
                {t('Minimálbér')}
              </button>
              <button
                type="button"
                className={value.atalanyWageBase !== 'minimum' ? 'active' : ''}
                aria-pressed={value.atalanyWageBase !== 'minimum'}
                onClick={() =>
                  onChange({ ...value, atalanyWageBase: 'skilled' })
                }
              >
                {t('Szakmunkás bérminimum')}
              </button>
            </div>
          )}
          <p className="field-hint">
            {t('Fodrász és kozmetikus általában szakmunkás bérminimumon van.')}
          </p>
          <div
            className="compact-switch pay-mode-switch"
            role="group"
            aria-label={t('Költséghányad')}
          >
            {atalanyRatios.map((ratio) => (
              <button
                type="button"
                className={value.atalanyCostRatio === ratio ? 'active' : ''}
                aria-pressed={value.atalanyCostRatio === ratio}
                onClick={() =>
                  onChange({ ...value, atalanyCostRatio: ratio })
                }
                key={ratio}
              >
                {ratio === 80 ? `80% · ${t('fodrász')}` : `${ratio}%`}
              </button>
            ))}
          </div>
          <p className="field-hint">
            {t(
              'Fodrászat és szépségápolás általában 80%, ha csak ebből van bevételed. Ha van más tevékenységed is, 45% az egész évre. A 90% kiskereskedelemre vonatkozik.',
            )}
          </p>
          <p className="field-hint">
            {t(
              'A költséghányad a bevételed felosztása az adóhoz. Nem plusz kiadás, a Havi kiadás kártyán csak az marad, amit te írtál be.',
            )}
          </p>
          <div className="tax-thresholds">
            <div className="tax-split">
              <div className="inline-total">
                <span>{t('Kitermelendő havi bevétel')}</span>
                <strong>
                  {money(neededAnnual / 12)}
                  {` ${t('/ hó')}`}
                </strong>
              </div>
              <div className="inline-total tax-split-part">
                <span>{t('Ebből költséghányad, nem valós kiadás')}</span>
                <strong>
                  {money(deemedCostMonthly)}
                  {` ${t('/ hó')}`}
                </strong>
              </div>
              <div className="inline-total tax-split-part">
                <span>{t('Ebből átalányjövedelem')}</span>
                <strong>
                  {money(deemedIncomeMonthly)}
                  {` ${t('/ hó')}`}
                </strong>
              </div>
            </div>
            <div className="inline-total">
              <span>{t('Adómentes havi bevétel')}</span>
              <strong>
                {money(atalanyTaxFreeRevenue(value.atalanyCostRatio) / 12)}
              </strong>
            </div>
            {value.under25 && (
              <div className="inline-total">
                <span>{t('25 év alatt SZJA nélkül, havi bevétel')}</span>
                <strong>{money(atalanySzjaFreeRevenue(value) / 12)}</strong>
              </div>
            )}
            {value.familyChildren > 0 && (
              <div className="inline-total">
                <span>{t('Családi kedvezmény keret')}</span>
                <strong>
                  {money(familyMonthlySaving(value.familyChildren))}
                  {` ${t('/ hó')}`}
                </strong>
              </div>
            )}
            {value.atalanyStatus === 'side' ? (
              <p className="field-hint">
                {t(
                  value.under25
                    ? 'Mellékállásban a kisebb határig minden közteher 0 Ft. A 25 év alattiak kedvezménye fölötte csak az SZJA-t viszi le, a TB és a szocho megmarad.'
                    : 'Mellékállásban eddig a havi bevételig SZJA, TB és szocho is 0 Ft.',
                )}
              </p>
            ) : (
              <>
                <div className="inline-total">
                  <span>{t('Havi minimum TB + szocho')}</span>
                  <strong>{money(atalanyMinMonthlyContrib(value))}</strong>
                </div>
                {value.under25 ? (
                  <p className="field-hint">
                    {t(
                      'Főállásban 25 év alatt is fizetni kell a minimum TB-t és szochót. Az SZJA a kedvezmény keretéig 0 Ft.',
                    )}
                  </p>
                ) : null}
              </>
            )}
            <div className="inline-total">
              <span>{t('Becsült havi adó')}</span>
              <strong>{money(taxMonthly)}</strong>
            </div>
          </div>
        </>
      )}
      {value.form === 'custom' && (
        <>
          <p className="panel-lead">
            {t(
              'SZJA, KIVA, társasági adó vagy bármilyen más forma. Írd be, amit havonta félreteszel adóra és járulékra.',
            )}
          </p>
          <NumberField
            label="Havi adó és járulék"
            value={value.customMonthly}
            onChange={(customMonthly) => onChange({ ...value, customMonthly })}
            suffix="Ft"
          />
        </>
      )}
    </>
  )
}

function CostEditor({
  costs,
  onChange,
}: {
  costs: Cost[]
  onChange: (costs: Cost[]) => void
}) {
  const { currency, language } = useLocale()
  const t = (text: string) => translate(language, text)
  const updateCost = (id: number, patch: Partial<Cost>) =>
    onChange(costs.map((cost) => (cost.id === id ? { ...cost, ...patch } : cost)))

  return (
    <div className="cost-editor">
      <div className="cost-table-head" aria-hidden="true">
        <span>{t('Megnevezés')}</span>
        <span>{t('Gyakoriság')}</span>
        <span>{t('Összeg')}</span>
        <span />
      </div>
      <div className="cost-list">
        {costs.map((cost) => (
          <div className="cost-row" key={cost.id}>
            <input
              aria-label={t('Költség megnevezése')}
              className="cost-name"
              value={t(cost.name)}
              onChange={(event) => updateCost(cost.id, { name: event.target.value })}
            />
            <select
              aria-label={t('Költség gyakorisága')}
              value={cost.period}
              onChange={(event) =>
                updateCost(cost.id, { period: event.target.value as Period })
              }
            >
              {(Object.keys(periodLabels) as Period[]).map((period) => (
                <option value={period} key={period}>
                  {t(periodLabels[period])}
                </option>
              ))}
            </select>
            <span className="cost-amount-shell">
              <AmountInput
                aria-label={t('Költség összege')}
                value={cost.amount}
                onChange={(amount) => updateCost(cost.id, { amount })}
              />
              <span>{currencySuffix(currency)}</span>
            </span>
            <button
              className="icon-button danger"
              type="button"
              aria-label={`${t(cost.name || 'Költség')} ${textByLang(
                language,
                'törlése',
                'delete',
                'smazat',
                'odstrániť',
              )}`}
              onClick={() => onChange(costs.filter((item) => item.id !== cost.id))}
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
      </div>
      <button
        className="add-row-button"
        type="button"
        onClick={() =>
          onChange([
            ...costs,
            { id: nextCostId++, name: '', period: 'month', amount: 0 },
          ])
        }
      >
        <Plus size={17} /> {t('Új költségsor')}
      </button>
    </div>
  )
}

function ServiceEditor({
  services,
  hourlyRate,
  materialFactor = 1,
  personKey,
  onChange,
}: {
  services: ServiceItem[]
  hourlyRate: number
  materialFactor?: number
  personKey: string
  onChange: Dispatch<SetStateAction<ServiceItem[]>>
}) {
  const { currency, language, hufPerEur, hufPerCzk } = useLocale()
  const t = (text: string) => translate(language, text)
  const rates = { hufPerEur, hufPerCzk }
  const formatRecommended = (value: number) =>
    value ? formatMoney(value, language, currency, rates) : '—'
  const commit = (updater: (current: ServiceItem[]) => ServiceItem[]) =>
    onChange((current) => withTrailingEmpty(updater(current)))
  const updateService = (id: number, patch: Partial<ServiceItem>) =>
    commit((current) =>
      current.map((service) =>
        service.id === id ? { ...service, ...patch } : service,
      ),
    )
  const namedServices = services.filter((service) => service.name.trim())
  const trailingBlankId = [...services].reverse().find(isBlankService)?.id
  const addPreset = (preset: ServicePreset) => {
    commit((current) => {
      const alreadyAdded = current.some(
        (service) =>
          service.name.trim().toLowerCase() === preset.name.toLowerCase(),
      )
      if (alreadyAdded) return current
      return [
        ...current.filter((service) => !isBlankService(service)),
        {
          id: allocateServiceId(current.map((service) => service.id)),
          name: preset.name,
          minutes: preset.minutes,
          materialCost: 0,
          newMaterialCost: 0,
          currentPrices: {},
        },
      ]
    })
  }

  return (
    <div className="cost-editor">
      <div className="service-presets" aria-label={t('Szolgáltatások')}>
        {servicePresets.map((preset) => {
          const alreadyAdded = namedServices.some(
            (service) =>
              service.name.trim().toLowerCase() === preset.name.toLowerCase(),
          )
          return (
            <button
              type="button"
              key={preset.name}
              className={alreadyAdded ? 'in-list' : ''}
              aria-pressed={alreadyAdded}
              disabled={alreadyAdded}
              onClick={() => addPreset(preset)}
            >
              {t(preset.name)}
              <small>
                {preset.minutes} {t('perc')}
              </small>
            </button>
          )
        })}
      </div>
      <div className="service-table-scroll">
        <div className="service-table">
      <div className="cost-table-head service-table-head">
        <span>{t('Megnevezés')}</span>
        <span>{t('Időtartam')}</span>
        <span>{t('Jelenlegi anyag')}</span>
        <span>{t('Új anyag')}</span>
        <span>{t('Jelenlegi ár')}</span>
        <span>{t('Ajánlott ár')}</span>
        <span />
      </div>
      <div className="cost-list">
        {services.map((service) => {
          const currentPrice = currentServicePrice(service, personKey)
          const calculated = recommendedServicePrice(
            hourlyRate,
            service.minutes,
            recommendedMaterialCost(service) * materialFactor,
          )
          const recommended = roundDisplayedPrice(calculated, currency, rates)
          const gap = currentPrice && recommended ? currentPrice - recommended : 0
          const tone = priceGapTone(currentPrice, recommended)
          const gapLabel =
            tone === 'behind'
              ? t('elmarad az ajánlott ártól')
              : tone === 'ahead'
                ? t('eléri vagy meghaladja az ajánlott árat')
                : undefined
          const gapText =
            tone === 'ahead' && gap === 0
              ? formatMoney(0, language, currency, rates)
              : tone
                ? `${gap > 0 ? '+' : '−'}${formatMoney(Math.abs(gap), language, currency, rates)}`
                : ''
          return (
            <div className="cost-row service-row" key={service.id}>
              <input
                aria-label={t('Szolgáltatás megnevezése')}
                className="cost-name"
                value={service.name}
                onChange={(event) =>
                  updateService(service.id, { name: event.target.value })
                }
              />
              <span className="cost-amount-shell service-minutes">
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  aria-label={t('Időtartam')}
                  value={service.minutes || ''}
                  onChange={(event) =>
                    updateService(service.id, {
                      minutes: Number(event.target.value) || 0,
                    })
                  }
                />
                <span>{t('perc')}</span>
              </span>
              <span className="cost-amount-shell">
                <AmountInput
                  aria-label={t('Jelenlegi anyag')}
                  value={service.materialCost}
                  onChange={(materialCost) =>
                    updateService(service.id, { materialCost })
                  }
                />
                <span>{currencySuffix(currency)}</span>
              </span>
              <span className="cost-amount-shell">
                <AmountInput
                  aria-label={t('Új anyag')}
                  value={service.newMaterialCost}
                  onChange={(newMaterialCost) =>
                    updateService(service.id, { newMaterialCost })
                  }
                />
                <span>{currencySuffix(currency)}</span>
              </span>
              <span className="cost-amount-shell">
                <AmountInput
                  aria-label={t('Jelenlegi ár')}
                  value={currentPrice}
                  onChange={(nextPrice) => {
                    const currentPrices = { ...service.currentPrices }
                    if (nextPrice > 0) currentPrices[personKey] = nextPrice
                    else delete currentPrices[personKey]
                    updateService(service.id, { currentPrices })
                  }}
                />
                <span>{currencySuffix(currency)}</span>
              </span>
              <div className="service-recommended">
                <strong>{formatRecommended(recommended)}</strong>
                {recommended &&
                calculated &&
                formatRecommended(recommended) !== formatRecommended(calculated) ? (
                  <small>
                    {t('számolt')}: {formatRecommended(calculated)}
                  </small>
                ) : null}
                {tone ? (
                  <span
                    className={`price-gap-chip ${tone}`}
                    aria-label={gapLabel}
                  >
                    {gapText}
                  </span>
                ) : null}
              </div>
              {service.id === trailingBlankId ? (
                <span />
              ) : (
                <button
                  className="icon-button danger"
                  type="button"
                  aria-label={`${service.name || t('Szolgáltatás megnevezése')} ${textByLang(
                    language,
                    'törlése',
                    'delete',
                    'smazat',
                    'odstrániť',
                  )}`}
                  onClick={() =>
                    commit((current) =>
                      current.filter((item) => item.id !== service.id),
                    )
                  }
                >
                  <Trash2 size={17} />
                </button>
              )}
            </div>
          )
        })}
      </div>
        </div>
      </div>
      <button
        className="add-row-button"
        type="button"
        onClick={() =>
          commit((current) => [
            ...current,
            emptyService(current.map((service) => service.id)),
          ])
        }
      >
        <Plus size={17} /> {t('Új szolgáltatás')}
      </button>
    </div>
  )
}

function MetricCard({
  label,
  value,
  detail,
  note,
  featured = false,
  soft = false,
  icon: Icon,
}: {
  label: string
  value: string
  detail: string
  note?: string
  featured?: boolean
  soft?: boolean
  icon: typeof Banknote
}) {
  const { language } = useLocale()
  return (
    <article
      className={`metric-card${featured ? ' featured' : ''}${soft ? ' soft' : ''}`}
    >
      <div className="metric-topline">
        <span>{translate(language, label)}</span>
        <Icon size={18} />
      </div>
      <strong>{value}</strong>
      <small>{translate(language, detail)}</small>
      {note ? <small>{note}</small> : null}
    </article>
  )
}

function Panel({
  eyebrow,
  title,
  children,
  action,
}: {
  eyebrow: string
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  const { language } = useLocale()
  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <span className="eyebrow">{translate(language, eyebrow)}</span>
          <h2>{translate(language, title)}</h2>
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}

export default function Calculator() {
  const [activeTab, setActiveTab] = useState<TabId>('solo')
  const [language, setLanguage] = useState<Language>('hu')
  const [currency, setCurrency] = useState<Currency>('HUF')
  const [hufPerEur, setHufPerEur] = useState(FALLBACK_HUF_PER_EUR)
  const [hufPerCzk, setHufPerCzk] = useState(FALLBACK_HUF_PER_CZK)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [soloWork, setSoloWork] = useState(initialWork)
  const [ownerWork, setOwnerWork] = useState(initialWork)
  const [employees, setEmployees] = useState<TeamMember[]>(() => [
    createEmployee(1),
  ])
  const [activeEmployeeId, setActiveEmployeeId] = useState(1)
  const [soloCosts, setSoloCosts] = useState(() =>
    createCosts(soloCostTemplates),
  )
  const [teamCosts, setTeamCosts] = useState(() =>
    createCosts(teamCostTemplates),
  )
  const [teamStaffCosts, setTeamStaffCosts] = useState(() =>
    createCosts(teamStaffCostTemplates),
  )
  const [ownerCosts, setOwnerCosts] = useState(() =>
    createCosts(ownerCostTemplates),
  )
  const [teamSize, setTeamSize] = useState(0)
  const [soloInvestment, setSoloInvestment] = useState({
    renovationYears: 0,
    renovationAmount: 0,
    equipmentYears: 0,
    equipmentAmount: 0,
  })
  const [teamInvestment, setTeamInvestment] = useState({
    renovationYears: 0,
    renovationAmount: 0,
    equipmentYears: 0,
    equipmentAmount: 0,
  })
  const [ownerSalonShare, setOwnerSalonShare] = useState<number | null>(null)
  const [pricing, setPricing] = useState({
    previousMaterials: 0,
    currentMaterials: 0,
    previousOther: 0,
    currentOther: 0,
    currentServicePrice: 0,
  })
  const [pricelistSource, setPricelistSource] =
    useState<PricelistSource>('solo')
  const [pricelistEmployeeId, setPricelistEmployeeId] = useState(1)
  const [services, setServices] = useState<ServiceItem[]>(() => [emptyService()])
  const [soloTax, setSoloTax] = useState<TaxSettings>(initialTax)
  const [ownerTax, setOwnerTax] = useState<TaxSettings>(initialTax)
  const [storageReady, setStorageReady] = useState(false)

  const t = (text: string) => translate(language, text)
  const rates = { hufPerEur, hufPerCzk }
  const formatFt = (value: number) =>
    formatMoney(value, language, currency, rates)
  const moneyOrDash = (value: number) => (value ? formatFt(value) : '—')
  const displayEurRate = Math.round(hufPerEur)
  const displayCzkRate = Math.round(hufPerCzk)

  useEffect(() => {
    let cancelled = false

    const loadRate = async () => {
      const nextRates = await fetchExchangeRates()
      if (!cancelled && nextRates) {
        setHufPerEur(nextRates.hufPerEur)
        setHufPerCzk(nextRates.hufPerCzk)
      }
    }

    void loadRate()
    return () => {
      cancelled = true
    }
  }, [])

  useLayoutEffect(() => {
    const saved = readPersistedCalculator()
    if (saved) {
      adoptIdCounters(saved)
      setActiveTab(saved.activeTab)
      setLanguage(saved.language)
      setCurrency(saved.currency)
      setSoloWork(saved.soloWork)
      setOwnerWork(saved.ownerWork)
      setEmployees(saved.employees)
      setActiveEmployeeId(saved.activeEmployeeId)
      setSoloCosts(saved.soloCosts)
      setTeamCosts(saved.teamCosts)
      setTeamStaffCosts(saved.teamStaffCosts)
      setOwnerCosts(saved.ownerCosts)
      setTeamSize(saved.teamSize)
      setSoloInvestment(saved.soloInvestment)
      setTeamInvestment(saved.teamInvestment)
      setOwnerSalonShare(saved.ownerSalonShare)
      setPricing(saved.pricing)
      setPricelistSource(saved.pricelistSource)
      setPricelistEmployeeId(
        saved.employees.some(
          (member) => member.id === saved.pricelistEmployeeId,
        )
          ? saved.pricelistEmployeeId
          : saved.employees[0].id,
      )
      setServices(
        saved.services.length > 0
          ? withTrailingEmpty(saved.services)
          : [emptyService()],
      )
      setSoloTax(saved.soloTax)
      setOwnerTax(saved.ownerTax)
    }
    setStorageReady(true)
  }, [])

  useEffect(() => {
    if (!storageReady) return
    const snapshot: PersistedCalculator = {
      version: STORAGE_VERSION,
      activeTab,
      language,
      currency,
      soloWork,
      ownerWork,
      employees,
      activeEmployeeId,
      soloCosts,
      teamCosts,
      teamStaffCosts,
      ownerCosts,
      teamSize,
      soloInvestment,
      teamInvestment,
      ownerSalonShare,
      pricing,
      pricelistSource,
      pricelistEmployeeId,
      services,
      soloTax,
      ownerTax,
    }
    const timer = window.setTimeout(() => {
      writePersistedCalculator(snapshot)
    }, 200)
    return () => window.clearTimeout(timer)
  }, [
    storageReady,
    activeTab,
    language,
    currency,
    soloWork,
    ownerWork,
    employees,
    activeEmployeeId,
    soloCosts,
    teamCosts,
    teamStaffCosts,
    ownerCosts,
    teamSize,
    soloInvestment,
    teamInvestment,
    ownerSalonShare,
    pricing,
    pricelistSource,
    pricelistEmployeeId,
    services,
    soloTax,
    ownerTax,
  ])
  const formatNumber = (value: number) => formatLocalizedNumber(value, language)
  const monthlyValue = (value: number) =>
    value ? `${formatFt(value)} ${t('/ hó')}` : '—'
  const annualValue = (value: number) =>
    value
      ? `${formatFt(value)} ${textByLang(language, 'évente', 'per year', 'za rok', 'za rok')}`
      : '—'
  const minuteValue = (value: number) =>
    value
      ? `${formatFt(value / 60)} ${textByLang(language, '/ perc', '/ minute', '/ minutu', '/ minútu')}`
      : '—'
  const workdayDetail = (value: number) =>
    value
      ? `${formatNumber(value)} ${textByLang(language, 'aktív munkanap', 'active workdays', 'aktivních pracovních dnů', 'aktívnych pracovných dní')}`
      : '—'
  const hourDetail = (value: number) =>
    value
      ? `${formatNumber(value)} ${textByLang(language, 'értékesíthető óra', 'billable hours', 'fakturovatelných hodin', 'fakturovateľných hodín')}`
      : '—'
  const employeeTitle = (name: string) => {
    const match = name.match(/^Munkatárs (\d+)$/)
    if (match) return `${t('Munkatárs')} ${match[1]}`
    return name
  }
  const activeEmployee =
    employees.find((member) => member.id === activeEmployeeId) ?? employees[0]
  const updateEmployee = (id: number, patch: Partial<TeamMember>) =>
    setEmployees((current) =>
      current.map((member) =>
        member.id === id ? { ...member, ...patch } : member,
      ),
    )
  const selectedPricelistMember =
    employees.find((member) => member.id === pricelistEmployeeId) ?? employees[0]
  const selectedPricelistWork =
    pricelistSource === 'owner'
      ? ownerWork
      : pricelistSource === 'employee'
        ? selectedPricelistMember.work
        : soloWork
  const setSelectedPricelistOccupancy = (occupancy: number) => {
    if (pricelistSource === 'solo') setSoloWork({ ...soloWork, occupancy })
    else if (pricelistSource === 'owner') setOwnerWork({ ...ownerWork, occupancy })
    else {
      updateEmployee(selectedPricelistMember.id, {
        work: { ...selectedPricelistMember.work, occupancy },
      })
    }
  }

  useEffect(() => {
    document.documentElement.lang = language
    document.title = textByLang(
      language,
      'Szalon pénzügyek',
      'Salon finances',
      'Finance salonu',
      'Financie salónu',
    )
  }, [language])

  const metrics = useMemo(() => {
    const soloDays = workDays(soloWork)
    const soloHours = billableHours(soloWork)
    const soloAmortization =
      soloInvestment.renovationAmount /
        Math.max(1, soloInvestment.renovationYears) +
      soloInvestment.equipmentAmount /
        Math.max(1, soloInvestment.equipmentYears)
    const soloBase = annualTotal(soloCosts) + soloAmortization
    const soloTaxAnnual = annualTaxOnBase(soloBase, soloTax)
    const soloAnnual = soloBase + soloTaxAnnual
    const teamAmortization =
      teamInvestment.renovationAmount /
        Math.max(1, teamInvestment.renovationYears) +
      teamInvestment.equipmentAmount /
        Math.max(1, teamInvestment.equipmentYears)
    const teamOperating = annualTotal(teamCosts) + annualTotal(teamStaffCosts)
    const teamAnnual = teamOperating + teamAmortization
    const teamPerPerson = teamAnnual / Math.max(1, teamSize)
    const actualOwnerShare = ownerSalonShare ?? teamPerPerson
    const ownerDays = workDays(ownerWork)
    const ownerHours = billableHours(ownerWork)
    const ownerBase = actualOwnerShare + annualTotal(ownerCosts)
    const ownerTaxAnnual = annualTaxOnBase(ownerBase, ownerTax)
    const ownerAnnual = ownerBase + ownerTaxAnnual
    const ownerPay = selectedAnnualTotal(ownerCosts, [
      'fizetés igényem',
      'fizetés',
    ])
    const ownerStaffProfit = employees.reduce(
      (sum, member) => sum + memberStaffProfit(member, teamPerPerson),
      0,
    )
    const actualEmployeeShare = activeEmployee.salonShare ?? teamPerPerson
    const employeeDays = workDays(activeEmployee.work)
    const employeeHours = billableHours(activeEmployee.work)
    const employeeAnnual =
      actualEmployeeShare + annualCostsForPayMode(activeEmployee)
    const employeePocket = selectedAnnualTotal(activeEmployee.costs, [
      'fizetés',
      'fizetés igényem',
      'egyéb juttatás',
    ])
    const productionMonthly =
      activeEmployee.payMode === 'percent'
        ? activeEmployee.monthlyProduction
        : 0
    const takeRatio = commissionRatio(activeEmployee)
    const takeHomeMonthly = productionMonthly * takeRatio
    const salonCardMonthly = productionMonthly * (1 - takeRatio)
    const producedHourly = memberServiceHourly(activeEmployee, teamPerPerson)
    const pricingComplete =
      pricing.previousMaterials > 0 &&
      pricing.currentMaterials > 0 &&
      pricing.previousOther > 0 &&
      pricing.currentOther > 0
    const hasServicePrice = pricing.currentServicePrice > 0
    const pricingPrevious = pricing.previousMaterials + pricing.previousOther
    const pricingCurrent = pricing.currentMaterials + pricing.currentOther
    const pricingChange = pricingCurrent - pricingPrevious
    const pricingPercent =
      pricingComplete && pricingPrevious > 0
        ? (pricingChange / pricingPrevious) * 100
        : 0
    const pricelistMember =
      employees.find((member) => member.id === pricelistEmployeeId) ??
      employees[0]
    const pricelistHourly =
      pricelistSource === 'owner'
        ? ownerHours
          ? ownerAnnual / ownerHours
          : 0
        : pricelistSource === 'employee'
          ? memberServiceHourly(pricelistMember, teamPerPerson)
          : soloHours
            ? soloAnnual / soloHours
            : 0
    const pricelistMaterialFactor =
      pricelistSource === 'employee'
        ? memberMaterialFactor(pricelistMember)
        : 1
    const pricelistOccupancy =
      pricelistSource === 'owner'
        ? ownerWork.occupancy
        : pricelistSource === 'employee'
          ? pricelistMember.work.occupancy
          : soloWork.occupancy

    return {
      solo: {
        annual: soloAnnual,
        monthly: soloAnnual / 12,
        hourly: soloHours ? soloAnnual / soloHours : 0,
        daily: soloDays ? soloAnnual / soloDays : 0,
        days: soloDays,
        hours: soloHours,
        pocket: selectedAnnualTotal(soloCosts, ['fizetés igényem', 'fizetés']),
        amortization: soloAmortization,
        tax: soloTaxAnnual,
        taxBase: soloBase,
      },
      team: {
        annual: teamAnnual,
        operating: teamOperating,
        amortization: teamAmortization,
        perPerson: teamPerPerson,
      },
      owner: {
        annual: ownerAnnual,
        monthly: ownerAnnual / 12,
        hourly: ownerHours ? ownerAnnual / ownerHours : 0,
        daily: ownerDays ? ownerAnnual / ownerDays : 0,
        days: ownerDays,
        hours: ownerHours,
        pocket: ownerPay,
        staffProfit: ownerStaffProfit,
        salonShare: actualOwnerShare,
        tax: ownerTaxAnnual,
        taxBase: ownerBase,
      },
      employee: {
        annual: employeeAnnual,
        monthly: employeeAnnual / 12,
        hourly: producedHourly,
        daily:
          activeEmployee.payMode === 'percent'
            ? employeeDays && productionMonthly
              ? (productionMonthly * 12) / employeeDays
              : 0
            : employeeDays
              ? employeeAnnual / employeeDays
              : 0,
        days: employeeDays,
        hours: employeeHours,
        pocket: employeePocket,
        salonShare: actualEmployeeShare,
        production: productionMonthly,
        takeHome: takeHomeMonthly,
        salonCard: salonCardMonthly,
        balance: salonCardMonthly - employeeAnnual / 12,
        staffProfit: memberStaffProfit(activeEmployee, teamPerPerson),
      },
      pricing: {
        complete: pricingComplete,
        hasServicePrice,
        previous: pricingPrevious,
        current: pricingCurrent,
        change: pricingChange,
        percent: pricingPercent,
        recommended:
          pricingComplete && hasServicePrice
            ? pricing.currentServicePrice * (1 + pricingPercent / 100)
            : 0,
      },
      pricelist: {
        hourly: pricelistHourly,
        materialFactor: pricelistMaterialFactor,
        occupancy: pricelistOccupancy,
        fromProduction:
          pricelistSource === 'employee' &&
          pricelistMember.payMode === 'percent',
        pricedCount: services.filter((service) => service.minutes > 0).length,
      },
    }
  }, [
    activeEmployee,
    employees,
    ownerCosts,
    ownerSalonShare,
    ownerTax,
    ownerWork,
    pricing,
    pricelistSource,
    pricelistEmployeeId,
    services,
    soloCosts,
    soloInvestment,
    soloTax,
    soloWork,
    teamCosts,
    teamInvestment,
    teamStaffCosts,
    teamSize,
  ])

  const currentTab = tabs.find((tab) => tab.id === activeTab) ?? tabs[0]
  const pricelistLines = services
    .filter((service) => service.minutes > 0)
    .map((service) => {
      const calculated = recommendedServicePrice(
        metrics.pricelist.hourly,
        service.minutes,
        recommendedMaterialCost(service) * metrics.pricelist.materialFactor,
      )
      const price = roundDisplayedPrice(calculated, currency, rates)
      const label = service.name.trim() || '—'
      return `${label} (${service.minutes} ${t('perc')}): ${formatFt(price)}`
    })

  const currentResultText = {
    hu: {
      solo: `Egyszemélyes szalon – fenntartható óradíj: ${formatFt(metrics.solo.hourly)}, éves kiadás: ${formatFt(metrics.solo.taxBase)}.`,
      team: `Többszemélyes szalon – éves költség személyenként: ${formatFt(metrics.team.perPerson)}, teljes éves kiadás: ${formatFt(metrics.team.annual)}.`,
      owner: `Saját órabérem: ${formatFt(metrics.owner.hourly)}, zsebben marad: ${formatFt(metrics.owner.pocket / 12)} / hó, haszon a munkatársakon: ${formatFt(metrics.owner.staffProfit / 12)} / hó.`,
      employee:
        activeEmployee.payMode === 'percent'
          ? `${employeeTitle(activeEmployee.name)} – havi termelés: ${formatFt(metrics.employee.production)}, visz haza: ${formatFt(metrics.employee.takeHome)} / hó, haszon a munkatársakon: ${formatFt(metrics.employee.staffProfit / 12)} / hó, óradíj: ${formatFt(metrics.employee.hourly)}.`
          : `${employeeTitle(activeEmployee.name)} – kitermelendő óradíj: ${formatFt(metrics.employee.hourly)}, havi teljes költség: ${formatFt(metrics.employee.monthly)}.`,
      pricing: metrics.pricing.complete
        ? metrics.pricing.hasServicePrice
          ? `Áremelési javaslat: ${metrics.pricing.percent.toFixed(1)}%, ajánlott új ár: ${formatFt(metrics.pricing.recommended)}.`
          : `Áremelési javaslat: ${metrics.pricing.percent.toFixed(1)}%.`
        : 'Áremelés tervező – töltsd ki mindkét időszak anyagköltségét és az összes többi kiadást.',
      pricelist: pricelistLines.length
        ? `Árlista – óradíj: ${formatFt(metrics.pricelist.hourly)}. ${pricelistLines.join(' ')}`
        : 'Árlista – add meg a szolgáltatások időtartamát. Az ár az óradíjból jön.',
    },
    en: {
      solo: `Solo salon – sustainable hourly rate: ${formatFt(metrics.solo.hourly)}, annual expenses: ${formatFt(metrics.solo.taxBase)}.`,
      team: `Team salon – annual cost per person: ${formatFt(metrics.team.perPerson)}, total annual expenses: ${formatFt(metrics.team.annual)}.`,
      owner: `My hourly rate: ${formatFt(metrics.owner.hourly)}, take-home: ${formatFt(metrics.owner.pocket / 12)} / month, profit from coworkers: ${formatFt(metrics.owner.staffProfit / 12)} / month.`,
      employee:
        activeEmployee.payMode === 'percent'
          ? `${employeeTitle(activeEmployee.name)} – monthly production: ${formatFt(metrics.employee.production)}, take-home: ${formatFt(metrics.employee.takeHome)} / month, profit from coworkers: ${formatFt(metrics.employee.staffProfit / 12)} / month, hourly rate: ${formatFt(metrics.employee.hourly)}.`
          : `${employeeTitle(activeEmployee.name)} – required hourly revenue: ${formatFt(metrics.employee.hourly)}, total monthly cost: ${formatFt(metrics.employee.monthly)}.`,
      pricing: metrics.pricing.complete
        ? metrics.pricing.hasServicePrice
          ? `Suggested price adjustment: ${metrics.pricing.percent.toFixed(1)}%, recommended new price: ${formatFt(metrics.pricing.recommended)}.`
          : `Suggested price adjustment: ${metrics.pricing.percent.toFixed(1)}%.`
        : 'Price adjustment planner – fill in material costs and all other expenses for both periods.',
      pricelist: pricelistLines.length
        ? `Price list – hourly rate: ${formatFt(metrics.pricelist.hourly)}. ${pricelistLines.join(' ')}`
        : 'Price list – enter service durations. Prices come from the hourly rate.',
    },
    cs: {
      solo: `Samostatný salon – udržitelná hodinová sazba: ${formatFt(metrics.solo.hourly)}, roční výdaje: ${formatFt(metrics.solo.taxBase)}.`,
      team: `Týmový salon – roční náklad na osobu: ${formatFt(metrics.team.perPerson)}, celkové roční výdaje: ${formatFt(metrics.team.annual)}.`,
      owner: `Moje hodinová sazba: ${formatFt(metrics.owner.hourly)}, zbude v kapse: ${formatFt(metrics.owner.pocket / 12)} / měsíc, zisk z kolegů: ${formatFt(metrics.owner.staffProfit / 12)} / měsíc.`,
      employee:
        activeEmployee.payMode === 'percent'
          ? `${employeeTitle(activeEmployee.name)} – měsíční produkce: ${formatFt(metrics.employee.production)}, odnese si: ${formatFt(metrics.employee.takeHome)} / měsíc, zisk z kolegů: ${formatFt(metrics.employee.staffProfit / 12)} / měsíc, hodinová sazba: ${formatFt(metrics.employee.hourly)}.`
          : `${employeeTitle(activeEmployee.name)} – potřebná hodinová sazba: ${formatFt(metrics.employee.hourly)}, celkové měsíční náklady: ${formatFt(metrics.employee.monthly)}.`,
      pricing: metrics.pricing.complete
        ? metrics.pricing.hasServicePrice
          ? `Návrh úpravy ceny: ${metrics.pricing.percent.toFixed(1)} %, doporučená nová cena: ${formatFt(metrics.pricing.recommended)}.`
          : `Návrh úpravy ceny: ${metrics.pricing.percent.toFixed(1)} %.`
        : 'Plánovač úpravy cen – vyplňte materiálové náklady a všechny ostatní výdaje za obě období.',
      pricelist: pricelistLines.length
        ? `Ceník – hodinová sazba: ${formatFt(metrics.pricelist.hourly)}. ${pricelistLines.join(' ')}`
        : 'Ceník – zadejte dobu trvání služeb. Cena vychází z hodinové sazby.',
    },
    sk: {
      solo: `Samostatný salón – udržateľná hodinová sadzba: ${formatFt(metrics.solo.hourly)}, ročné výdavky: ${formatFt(metrics.solo.taxBase)}.`,
      team: `Tímový salón – ročný náklad na osobu: ${formatFt(metrics.team.perPerson)}, celkové ročné výdavky: ${formatFt(metrics.team.annual)}.`,
      owner: `Moja hodinová sadzba: ${formatFt(metrics.owner.hourly)}, zostane v peňaženke: ${formatFt(metrics.owner.pocket / 12)} / mesiac, zisk z kolegov: ${formatFt(metrics.owner.staffProfit / 12)} / mesiac.`,
      employee:
        activeEmployee.payMode === 'percent'
          ? `${employeeTitle(activeEmployee.name)} – mesačná produkcia: ${formatFt(metrics.employee.production)}, odnesie si: ${formatFt(metrics.employee.takeHome)} / mesiac, zisk z kolegov: ${formatFt(metrics.employee.staffProfit / 12)} / mesiac, hodinová sadzba: ${formatFt(metrics.employee.hourly)}.`
          : `${employeeTitle(activeEmployee.name)} – potrebná hodinová sadzba: ${formatFt(metrics.employee.hourly)}, celkové mesačné náklady: ${formatFt(metrics.employee.monthly)}.`,
      pricing: metrics.pricing.complete
        ? metrics.pricing.hasServicePrice
          ? `Návrh úpravy ceny: ${metrics.pricing.percent.toFixed(1)} %, odporúčaná nová cena: ${formatFt(metrics.pricing.recommended)}.`
          : `Návrh úpravy ceny: ${metrics.pricing.percent.toFixed(1)} %.`
        : 'Plánovač úpravy cien – vyplňte materiálové náklady a všetky ostatné výdavky za obe obdobia.',
      pricelist: pricelistLines.length
        ? `Cenník – hodinová sadzba: ${formatFt(metrics.pricelist.hourly)}. ${pricelistLines.join(' ')}`
        : 'Cenník – zadajte trvanie služieb. Cena vychádza z hodinovej sadzby.',
    },
  }[language][activeTab]

  const resetCurrent = () => {
    if (activeTab === 'solo') {
      setSoloWork(initialWork)
      setSoloCosts(createCosts(soloCostTemplates))
      setSoloInvestment({
        renovationYears: 0,
        renovationAmount: 0,
        equipmentYears: 0,
        equipmentAmount: 0,
      })
      setSoloTax({ ...initialTax })
    }
    if (activeTab === 'team') {
      setTeamCosts(createCosts(teamCostTemplates))
      setTeamStaffCosts(createCosts(teamStaffCostTemplates))
      setTeamSize(0)
      setTeamInvestment({
        renovationYears: 0,
        renovationAmount: 0,
        equipmentYears: 0,
        equipmentAmount: 0,
      })
    }
    if (activeTab === 'owner') {
      setOwnerWork(initialWork)
      setOwnerCosts(createCosts(ownerCostTemplates))
      setOwnerSalonShare(null)
      setOwnerTax({ ...initialTax })
    }
    if (activeTab === 'employee') {
      const first = createEmployee(1)
      setEmployees([first])
      setActiveEmployeeId(first.id)
    }
    if (activeTab === 'pricing') {
      setPricing({
        previousMaterials: 0,
        currentMaterials: 0,
        previousOther: 0,
        currentOther: 0,
        currentServicePrice: 0,
      })
    }
    if (activeTab === 'pricelist') {
      setPricelistSource('solo')
      setPricelistEmployeeId(employees[0]?.id ?? 1)
      setServices([emptyService()])
    }
  }

  const changeTab = (id: TabId) => {
    setActiveTab(id)
    setMobileMenuOpen(false)
  }

  const printCurrentReport = () => {
    const previousTitle = document.title
    document.title = `${t('Szalon pénzügyek')} – ${t(currentTab.label)} – ${t('Nyomtatásra kész kimutatás')}`
    window.addEventListener(
      'afterprint',
      () => {
        document.title = previousTitle
      },
      { once: true },
    )
    window.print()
  }

  const addEmployee = () => {
    const member = createEmployee(employees.length + 1)
    setEmployees((current) => [...current, member])
    setActiveEmployeeId(member.id)
    setTeamSize((size) => Math.max(size, employees.length + 2))
  }

  const removeEmployee = (id: number) => {
    if (employees.length <= 1) return
    const remaining = employees.filter((member) => member.id !== id)
    const nextActive = remaining.find((member) => member.id === activeEmployeeId) ?? remaining[0]
    setEmployees(remaining)
    if (nextActive) setActiveEmployeeId(nextActive.id)
    if (!remaining.some((member) => member.id === pricelistEmployeeId) && remaining[0]) {
      setPricelistEmployeeId(remaining[0].id)
    }
    setServices((current) => pruneEmployeeServicePrices(current, id))
  }

  return (
    <LocaleContext.Provider value={{ language, currency, hufPerEur, hufPerCzk }}>
    <div className="app-shell">
      <aside className={`sidebar${mobileMenuOpen ? ' open' : ''}`}>
        <div className="brand-block">
          <div className="brand-mark">
            <Scissors size={21} />
          </div>
          <div>
            <strong>{t('Szalon pénzügyek')}</strong>
          </div>
          <button
            className="mobile-close"
            type="button"
            aria-label={t('Menü bezárása')}
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={21} />
          </button>
        </div>

        <div className="nav-label">{t('Kalkulátorok')}</div>
        <nav className="side-nav" aria-label={t('Kalkulátor nézetek')}>
          {navigationGroups.map((group) => {
            const groupTabs = tabs.filter((tab) => group.tabIds.includes(tab.id))
            const isActiveGroup = group.tabIds.includes(activeTab)

            return (
              <section
                className={`nav-group nav-group-${group.id}${isActiveGroup ? ' active' : ''}`}
                key={group.id}
                aria-label={t(group.label)}
              >
                <div className="nav-group-heading">
                  <strong>{t(group.label)}</strong>
                </div>
                <div className="nav-items">
                  {groupTabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        type="button"
                        key={tab.id}
                        className={activeTab === tab.id ? 'active' : ''}
                        onClick={() => changeTab(tab.id)}
                      >
                        <Icon size={19} />
                        <span>
                          <strong>{t(tab.label)}</strong>
                          <small>{t(tab.description)}</small>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </nav>

        <div className="sidebar-note">
          <Sparkles size={18} />
          <div>
            <strong>{t('Élő számítás')}</strong>
            <span>{t('Minden módosítás azonnal megjelenik az eredményekben.')}</span>
          </div>
        </div>
      </aside>

      {mobileMenuOpen && (
        <button
          className="menu-scrim"
          type="button"
          aria-label={t('Menü bezárása')}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <main className="main-content">
        <header className="topbar">
          <button
            className="menu-button"
            type="button"
            aria-label={t('Menü megnyitása')}
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={21} />
          </button>
          <div className="topbar-context">
            <span>
              {textByLang(
                language,
                `${yearAdjective(currentCalendarYear())} tervező`,
                `${currentCalendarYear()} planner`,
                `Plánovač ${currentCalendarYear()}`,
                `Plánovač ${currentCalendarYear()}`,
              )}
            </span>
            <i />
            <span>
              {currency === 'HUF'
                ? t('Magyar forint')
                : currency === 'CZK'
                  ? t('Cseh korona')
                  : t('Euro')}
            </span>
          </div>
          <div className="topbar-actions">
            <div className="display-switches">
              <div
                className="compact-switch"
                aria-label={textByLang(
                  language,
                  'Nyelvválasztó',
                  'Language selector',
                  'Výběr jazyka',
                  'Výber jazyka',
                )}
              >
                <Languages size={16} aria-hidden="true" />
                {(['hu', 'en', 'cs', 'sk'] as Language[]).map((option) => (
                  <button
                    type="button"
                    className={language === option ? 'active' : ''}
                    aria-pressed={language === option}
                    onClick={() => setLanguage(option)}
                    key={option}
                  >
                    {option.toUpperCase()}
                  </button>
                ))}
              </div>
              <div
                className="compact-switch currency-switch"
                aria-label={`${textByLang(
                  language,
                  'Pénznemválasztó',
                  'Currency selector',
                  'Výběr měny',
                  'Výber meny',
                )}, 1 EUR = ${displayEurRate} HUF, 1 CZK = ${displayCzkRate} HUF`}
                title={`1 EUR = ${displayEurRate} HUF · 1 CZK = ${displayCzkRate} HUF`}
              >
                <Coins size={16} aria-hidden="true" />
                <small className="switch-rate">
                  <span>1 € = {displayEurRate} Ft</span>
                  <span>1 Kč = {displayCzkRate} Ft</span>
                </small>
                {(['HUF', 'EUR', 'CZK'] as Currency[]).map((option) => (
                  <button
                    type="button"
                    className={currency === option ? 'active' : ''}
                    aria-pressed={currency === option}
                    onClick={() => setCurrency(option)}
                    key={option}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <button className="ghost-button" type="button" onClick={resetCurrent}>
              <RotateCcw size={17} />
              <span>{t('Alaphelyzet')}</span>
            </button>
            <button
              className="ghost-button print-button"
              type="button"
              onClick={printCurrentReport}
            >
              <Printer size={17} />
              <span>{t('PDF mentése')}</span>
            </button>
          </div>
        </header>

        <nav className="calculator-switcher" aria-label={t('Kalkulátor gyorsválasztó')}>
          {navigationGroups.map((group) => {
            const groupTabs = tabs.filter((tab) => group.tabIds.includes(tab.id))
            const isActiveGroup = group.tabIds.includes(activeTab)

            return (
              <section
                className={`switcher-pile switcher-pile-${group.id}${isActiveGroup ? ' active' : ''}`}
                key={group.id}
                aria-label={t(group.label)}
              >
                <div className="switcher-pile-heading">
                  <strong>{t(group.label)}</strong>
                </div>
                <div className="switcher-pile-tabs">
                  {groupTabs.map((tab) => (
                    <button
                      type="button"
                      className={activeTab === tab.id ? 'active' : ''}
                      onClick={() => changeTab(tab.id)}
                      key={tab.id}
                    >
                      {t(tab.shortLabel)}
                    </button>
                  ))}
                </div>
              </section>
            )
          })}
        </nav>

        <div className="content-wrap">
          <section className="print-report-header">
            <div className="print-report-brand">
              <Scissors size={22} aria-hidden="true" />
              <div>
                <strong>{t('Szalon pénzügyek')}</strong>
                <span>{t('Nyomtatásra kész kimutatás')}</span>
              </div>
            </div>
            <div className="print-report-meta">
              <span>{t('Aktuális kalkuláció összefoglalója')}</span>
              <strong>{t(currentTab.label)}</strong>
              <small>
                {currency === 'HUF'
                  ? t('Magyar forint')
                  : currency === 'CZK'
                    ? t('Cseh korona')
                    : t('Euro')}
              </small>
            </div>
            <p>{currentResultText}</p>
          </section>
          <section className="page-heading">
            <div>
              <span className="eyebrow">{t('Pénzügyi műhely')}</span>
              <h1>{t(currentTab.label)}</h1>
              <p>{t(currentTab.description)}. {t('Állítsd be a valós számaidat, az eredmények automatikusan frissülnek.')}</p>
            </div>
            <div className="status-pill">
              <span /> {t('Élő kalkuláció')}
            </div>
          </section>

          {activeTab === 'solo' && (
            <>
              <div className="metric-grid five">
                <MetricCard
                  featured
                  label="Zsebben marad"
                  value={monthlyValue(metrics.solo.pocket / 12)}
                  detail={annualValue(metrics.solo.pocket)}
                  icon={Banknote}
                />
                <MetricCard
                  label="Fenntartható óradíj"
                  value={moneyOrDash(metrics.solo.hourly)}
                  detail={minuteValue(metrics.solo.hourly)}
                  icon={Clock3}
                />
                <MetricCard
                  label="Szükséges napidíj"
                  value={moneyOrDash(metrics.solo.daily)}
                  detail={workdayDetail(metrics.solo.days)}
                  icon={CalendarDays}
                />
                <MetricCard
                  label="Havi kiadás"
                  value={moneyOrDash(metrics.solo.taxBase / 12)}
                  detail={annualValue(metrics.solo.taxBase)}
                  note={t('csak a beírt költségek, adó nélkül')}
                  icon={ArrowDownRight}
                />
                <MetricCard
                  label="Havi adó"
                  value={moneyOrDash(metrics.solo.tax / 12)}
                  detail={annualValue(metrics.solo.tax)}
                  icon={Landmark}
                />
              </div>

              <div className="two-column-layout">
                <Panel eyebrow="Kapacitás" title="Munkaidő és terhelés">
                  <WorkFields value={soloWork} onChange={setSoloWork} />
                </Panel>
                <Panel eyebrow="Fejlesztési alap" title="Nagyobb beruházások">
                  <div className="investment-grid">
                    <NumberField
                      label="Felújítás összege"
                      value={soloInvestment.renovationAmount}
                      onChange={(value) =>
                        setSoloInvestment({ ...soloInvestment, renovationAmount: value })
                      }
                      suffix="Ft"
                    />
                    <NumberField
                      label="Felújítási ciklus"
                      value={soloInvestment.renovationYears}
                      onChange={(value) =>
                        setSoloInvestment({ ...soloInvestment, renovationYears: value })
                      }
                      suffix="év"
                    />
                    <NumberField
                      label="Eszközbeszerzés"
                      value={soloInvestment.equipmentAmount}
                      onChange={(value) =>
                        setSoloInvestment({ ...soloInvestment, equipmentAmount: value })
                      }
                      suffix="Ft"
                    />
                    <NumberField
                      label="Eszközcsere ciklusa"
                      value={soloInvestment.equipmentYears}
                      onChange={(value) =>
                        setSoloInvestment({ ...soloInvestment, equipmentYears: value })
                      }
                      suffix="év"
                    />
                  </div>
                  <div className="inline-total">
                    <span>{t('Éves beruházási tartalék')}</span>
                    <strong>{moneyOrDash(metrics.solo.amortization)}</strong>
                  </div>
                </Panel>
              </div>
              <Panel eyebrow="Adózás" title="Adózási forma">
                <TaxEditor
                  value={soloTax}
                  onChange={setSoloTax}
                  baseAnnual={metrics.solo.taxBase}
                />
              </Panel>
              <Panel eyebrow="Kiadások" title="Szalon költségszerkezete">
                <CostEditor costs={soloCosts} onChange={setSoloCosts} />
              </Panel>
            </>
          )}

          {activeTab === 'team' && (
            <>
              <div className="metric-grid four">
                <MetricCard
                  featured
                  label="Éves költség / fő"
                  value={moneyOrDash(metrics.team.perPerson)}
                  detail={`${teamSize} ${textByLang(
                    language,
                    'fős szalonra osztva',
                    'people sharing salon costs',
                    'osob sdílí náklady salonu',
                    'osôb zdieľa náklady salónu',
                  )}`}
                  icon={UsersRound}
                />
                <MetricCard
                  label="Szalon éves kiadása"
                  value={moneyOrDash(metrics.team.annual)}
                  detail="teljes működési szükséglet"
                  icon={Building2}
                />
                <MetricCard
                  label="Működési költségek"
                  value={moneyOrDash(metrics.team.operating)}
                  detail="beruházások nélkül"
                  icon={Banknote}
                />
                <MetricCard
                  label="Éves beruházási alap"
                  value={moneyOrDash(metrics.team.amortization)}
                  detail="felújítás és eszközök"
                  icon={Sparkles}
                />
              </div>
              <div className="two-column-layout team-settings">
                <Panel eyebrow="Szalon" title="Létszám és költségmegosztás">
                  <div className="team-size-control">
                    <button
                      type="button"
                      onClick={() => setTeamSize(Math.max(0, teamSize - 1))}
                    >
                      −
                    </button>
                    <div>
                      <strong>{teamSize}</strong>
                      <span>{t('aktív szakember')}</span>
                    </div>
                    <button type="button" onClick={() => setTeamSize(teamSize + 1)}>
                      +
                    </button>
                  </div>
                  <p className="panel-copy">{t('A közös szalonköltséget egyenlő arányban osztjuk el az aktív szakemberek között.')}</p>
                </Panel>
                <Panel eyebrow="Beruházások" title="Közös fejlesztési keret">
                  <div className="investment-grid">
                    <NumberField
                      label="Felújítás összege"
                      value={teamInvestment.renovationAmount}
                      onChange={(value) =>
                        setTeamInvestment({ ...teamInvestment, renovationAmount: value })
                      }
                      suffix="Ft"
                    />
                    <NumberField
                      label="Felújítási ciklus"
                      value={teamInvestment.renovationYears}
                      onChange={(value) =>
                        setTeamInvestment({ ...teamInvestment, renovationYears: value })
                      }
                      suffix="év"
                    />
                    <NumberField
                      label="Eszközbeszerzés"
                      value={teamInvestment.equipmentAmount}
                      onChange={(value) =>
                        setTeamInvestment({ ...teamInvestment, equipmentAmount: value })
                      }
                      suffix="Ft"
                    />
                    <NumberField
                      label="Eszközcsere ciklusa"
                      value={teamInvestment.equipmentYears}
                      onChange={(value) =>
                        setTeamInvestment({ ...teamInvestment, equipmentYears: value })
                      }
                      suffix="év"
                    />
                  </div>
                </Panel>
              </div>
              <Panel
                eyebrow="Háttérszemélyzet"
                title="Recepció, marketing és más nem termelő kollégák"
              >
                <CostEditor costs={teamStaffCosts} onChange={setTeamStaffCosts} />
                <p className="panel-copy">
                  {t(
                    'A recepciós, marketinges és más nem termelő kollégák bérét ide írd. Ők nem számítanak az aktív szakemberek létszámába.',
                  )}
                </p>
              </Panel>
              <Panel eyebrow="Közös kiadások" title="Szalon költségszerkezete">
                <CostEditor costs={teamCosts} onChange={setTeamCosts} />
              </Panel>
            </>
          )}

          {activeTab === 'owner' && (
            <>
              <div className="metric-grid two">
                <MetricCard
                  featured
                  label="Zsebben marad"
                  value={monthlyValue(metrics.owner.pocket / 12)}
                  detail={annualValue(metrics.owner.pocket)}
                  note={t('csak a saját béred')}
                  icon={Banknote}
                />
                <MetricCard
                  featured
                  soft
                  label="Haszon a munkatársakon"
                  value={monthlyValue(metrics.owner.staffProfit / 12)}
                  detail={annualValue(metrics.owner.staffProfit)}
                  note={
                    metrics.owner.pocket + metrics.owner.staffProfit
                      ? `${t('összesen a zsebedbe')} ${monthlyValue(
                          (metrics.owner.pocket + metrics.owner.staffProfit) / 12,
                        )}`
                      : t(
                          'Százalékos munkatársnál ide jön a termelés maradéka, a költségek után.',
                        )
                  }
                  icon={TrendingUp}
                />
              </div>
              <div className="metric-grid four">
                <MetricCard
                  label="Saját órabéred"
                  value={moneyOrDash(metrics.owner.hourly)}
                  detail={minuteValue(metrics.owner.hourly)}
                  icon={Clock3}
                />
                <MetricCard
                  label="Napidíjad"
                  value={moneyOrDash(metrics.owner.daily)}
                  detail={workdayDetail(metrics.owner.days)}
                  icon={CalendarDays}
                />
                <MetricCard
                  label="Havi szükséglet"
                  value={moneyOrDash(metrics.owner.taxBase / 12)}
                  detail={annualValue(metrics.owner.taxBase)}
                  note={t('csak a beírt költségek, adó nélkül')}
                  icon={ArrowDownRight}
                />
                <MetricCard
                  label="Havi adó"
                  value={moneyOrDash(metrics.owner.tax / 12)}
                  detail={annualValue(metrics.owner.tax)}
                  icon={Landmark}
                />
              </div>
              <div className="two-column-layout">
                <Panel eyebrow="Rád eső rész" title="Szalon költsége">
                  <NumberField
                    label="Éves szalonköltség / fő"
                    value={Math.round(metrics.owner.salonShare)}
                    onChange={(value) => setOwnerSalonShare(value)}
                    suffix="Ft"
                    hint={
                      ownerSalonShare === null
                        ? 'Automatikusan a szalon kalkulátorból.'
                        : 'Egyedi értékkel felülírva.'
                    }
                  />
                  {ownerSalonShare !== null && (
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => setOwnerSalonShare(null)}
                    >
                      {t('Vissza az automatikus értékre')}
                    </button>
                  )}
                </Panel>
                <Panel eyebrow="Kapacitás" title="Saját munkaidőd">
                  <WorkFields value={ownerWork} onChange={setOwnerWork} />
                </Panel>
              </div>
              <Panel eyebrow="Adózás" title="Adózási forma">
                <TaxEditor
                  value={ownerTax}
                  onChange={setOwnerTax}
                  baseAnnual={metrics.owner.taxBase}
                />
              </Panel>
              <Panel eyebrow="Személyes célok" title="Saját költségek és jövedelem">
                <CostEditor costs={ownerCosts} onChange={setOwnerCosts} />
              </Panel>
            </>
          )}

          {activeTab === 'employee' && (
            <>
              <div className="employee-bar">
                <div className="employee-tabs" role="tablist" aria-label={t('Munkatársak')}>
                  {employees.map((member) => (
                    <div
                      className={`employee-tab${member.id === activeEmployee.id ? ' active' : ''}`}
                      key={member.id}
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={member.id === activeEmployee.id}
                        onClick={() => setActiveEmployeeId(member.id)}
                      >
                        {employeeTitle(member.name) || t('Munkatárs')}
                      </button>
                      {employees.length > 1 && (
                        <button
                          type="button"
                          className="employee-tab-remove"
                          aria-label={`${employeeTitle(member.name) || t('Munkatárs')} ${textByLang(
                            language,
                            'törlése',
                            'delete',
                            'smazat',
                            'odstrániť',
                          )}`}
                          onClick={() => removeEmployee(member.id)}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  className="add-employee-button"
                  type="button"
                  onClick={addEmployee}
                >
                  <Plus size={17} /> {t('Új munkatárs')}
                </button>
              </div>
              <div className={activeEmployee.payMode === 'percent' ? 'metric-grid four' : 'metric-grid five'}>
                {activeEmployee.payMode === 'percent' ? (
                  <>
                    <MetricCard
                      featured
                      label="Munkatárs visz haza"
                      value={monthlyValue(metrics.employee.takeHome)}
                      detail={`${activeEmployee.commissionPercent || 0}% ${t('a havi termelésből')}`}
                      icon={Banknote}
                    />
                    <MetricCard
                      label="Visszaszámolt óradíj"
                      value={moneyOrDash(metrics.employee.hourly)}
                      detail="a havi termelésből"
                      icon={Clock3}
                    />
                    <MetricCard
                      label="Kitermelendő napidíj"
                      value={moneyOrDash(metrics.employee.daily)}
                      detail={workdayDetail(metrics.employee.days)}
                      icon={CalendarDays}
                    />
                    <MetricCard
                      label="Szalon havi szükséglete"
                      value={moneyOrDash(metrics.employee.monthly)}
                      detail="minden teherrel együtt"
                      icon={ArrowDownRight}
                    />
                  </>
                ) : (
                  <>
                    <MetricCard
                      featured
                      label="Munkatárs jövedelme"
                      value={monthlyValue(metrics.employee.pocket / 12)}
                      detail={annualValue(metrics.employee.pocket)}
                      icon={Banknote}
                    />
                    <MetricCard
                      label="Kitermelendő óradíj"
                      value={moneyOrDash(metrics.employee.hourly)}
                      detail={minuteValue(metrics.employee.hourly)}
                      icon={Clock3}
                    />
                    <MetricCard
                      label="Kitermelendő napidíj"
                      value={moneyOrDash(metrics.employee.daily)}
                      detail={workdayDetail(metrics.employee.days)}
                      icon={CalendarDays}
                    />
                    <MetricCard
                      label="Havi teljes költség"
                      value={moneyOrDash(metrics.employee.monthly)}
                      detail="minden teherrel együtt"
                      icon={ArrowDownRight}
                    />
                    <MetricCard
                      label="Éves teljes költség"
                      value={moneyOrDash(metrics.employee.annual)}
                      detail={hourDetail(metrics.employee.hours)}
                      icon={BriefcaseBusiness}
                    />
                  </>
                )}
              </div>
              <div className="two-column-layout">
                <Panel eyebrow="Rá eső rész" title="Szalon költsége">
                  <div className="field-grid">
                    <TextField
                      label="Megnevezés"
                      value={activeEmployee.name}
                      onChange={(name) =>
                        updateEmployee(activeEmployee.id, { name })
                      }
                    />
                    <NumberField
                      label="Éves szalonköltség / fő"
                      value={Math.round(metrics.employee.salonShare)}
                      onChange={(value) =>
                        updateEmployee(activeEmployee.id, { salonShare: value })
                      }
                      suffix="Ft"
                      hint={
                        activeEmployee.salonShare === null
                          ? 'Automatikusan a szalon kalkulátorból.'
                          : 'Egyedi értékkel felülírva.'
                      }
                    />
                  </div>
                  {activeEmployee.salonShare !== null && (
                    <button
                      className="text-button"
                      type="button"
                      onClick={() =>
                        updateEmployee(activeEmployee.id, { salonShare: null })
                      }
                    >
                      {t('Vissza az automatikus értékre')}
                    </button>
                  )}
                </Panel>
                <Panel eyebrow="Kapacitás" title="Munkatárs munkaideje">
                  <WorkFields
                    value={activeEmployee.work}
                    onChange={(work) =>
                      updateEmployee(activeEmployee.id, { work })
                    }
                  />
                </Panel>
              </div>
              <Panel eyebrow="Elszámolás" title="Bérezés módja">
                <div
                  className="compact-switch pay-mode-switch"
                  role="group"
                  aria-label={t('Bérezés módja')}
                >
                  <button
                    type="button"
                    className={activeEmployee.payMode !== 'percent' ? 'active' : ''}
                    aria-pressed={activeEmployee.payMode !== 'percent'}
                    onClick={() =>
                      updateEmployee(activeEmployee.id, { payMode: 'salary' })
                    }
                  >
                    {t('Fix bér')}
                  </button>
                  <button
                    type="button"
                    className={activeEmployee.payMode === 'percent' ? 'active' : ''}
                    aria-pressed={activeEmployee.payMode === 'percent'}
                    onClick={() =>
                      updateEmployee(activeEmployee.id, { payMode: 'percent' })
                    }
                  >
                    {t('Százalékos rendszer')}
                  </button>
                </div>
                {activeEmployee.payMode === 'percent' && (
                  <>
                    <p className="panel-lead">
                      {t(
                        'A munkatárs havi vendégforgalma. Ebből megy a százalék, a maradék a Saját órabérem oldalon a Haszon a munkatársakon kártyán jelenik meg. Az óradíjat a termelésből számoljuk vissza.',
                      )}
                    </p>
                    <NumberField
                      label="Átlagos havi termelés"
                      value={activeEmployee.monthlyProduction}
                      onChange={(monthlyProduction) =>
                        updateEmployee(activeEmployee.id, {
                          monthlyProduction,
                        })
                      }
                      suffix="Ft"
                      hint={
                        activeEmployee.commissionAfterMaterials !== false
                          ? 'A százalék az anyag nélküli termelésből számolódik. Az átlagos termelésbe az anyag nélküli forgalmat írd.'
                          : 'A munkatárs havi vendégforgalma. Ebből megy a százalék, a maradék a Saját órabérem oldalon a Haszon a munkatársakon kártyán jelenik meg. Az óradíjat a termelésből számoljuk vissza.'
                      }
                    />
                    <div className="field-grid two pay-mode-fields">
                      <NumberField
                        label="A fodrász részesedése"
                        value={activeEmployee.commissionPercent}
                        onChange={(commissionPercent) =>
                          updateEmployee(activeEmployee.id, {
                            commissionPercent: Math.min(
                              MAX_COMMISSION_PERCENT,
                              Math.max(0, commissionPercent),
                            ),
                          })
                        }
                        suffix="%"
                        hint="A havi termelésből ennyi a munkatársé. A maradék a Saját órabérem oldalon a Haszon a munkatársakon kártyán jelenik meg."
                      />
                      <label className="check-field">
                        <input
                          type="checkbox"
                          checked={
                            activeEmployee.commissionAfterMaterials !== false
                          }
                          onChange={(event) =>
                            updateEmployee(activeEmployee.id, {
                              commissionAfterMaterials: event.target.checked,
                            })
                          }
                        />
                        <span>
                          <strong>{t('Anyag levonása előbb')}</strong>
                          <small>
                            {t(
                              activeEmployee.commissionAfterMaterials !== false
                                ? 'A százalék az anyag nélküli termelésből számolódik. Az átlagos termelésbe az anyag nélküli forgalmat írd.'
                                : 'A százalék a teljes vendégárból számolódik.',
                            )}
                          </small>
                        </span>
                      </label>
                    </div>
                  </>
                )}
              </Panel>
              <Panel
                eyebrow="Munkáltatói teher"
                title={
                  activeEmployee.payMode === 'percent'
                    ? 'Járulék és juttatások'
                    : 'Bér, járulék és juttatások'
                }
              >
                <CostEditor
                  costs={visibleEmployeeCosts(activeEmployee)}
                  onChange={(costs) =>
                    updateEmployee(activeEmployee.id, {
                      costs: mergeEmployeeCosts(activeEmployee, costs),
                    })
                  }
                />
              </Panel>
            </>
          )}

          {activeTab === 'pricing' && (
            <>
              <div className="metric-grid four">
                <MetricCard
                  label="Előző időszak"
                  value={
                    metrics.pricing.complete
                      ? formatFt(metrics.pricing.previous)
                      : '—'
                  }
                  detail={
                    metrics.pricing.complete
                      ? 'összes vizsgált költség'
                      : 'Kitöltésre vár'
                  }
                  icon={CalendarDays}
                />
                <MetricCard
                  label="Jelenlegi időszak"
                  value={
                    metrics.pricing.complete
                      ? formatFt(metrics.pricing.current)
                      : '—'
                  }
                  detail={
                    metrics.pricing.complete
                      ? 'összes vizsgált költség'
                      : 'Kitöltésre vár'
                  }
                  icon={CircleDollarSign}
                />
                <MetricCard
                  label="Változás forintban"
                  value={
                    metrics.pricing.complete
                      ? formatFt(metrics.pricing.change)
                      : '—'
                  }
                  detail={
                    metrics.pricing.complete
                      ? 'időszakok különbsége'
                      : 'Kitöltésre vár'
                  }
                  icon={TrendingUp}
                />
                <MetricCard
                  featured
                  label="Javasolt korrekció"
                  value={
                    metrics.pricing.complete
                      ? `${metrics.pricing.percent.toFixed(1)}%`
                      : '—'
                  }
                  detail={
                    metrics.pricing.complete
                      ? 'minimum áremelési szint'
                      : 'Kitöltésre vár'
                  }
                  icon={ArrowUpRight}
                />
              </div>
              <div className="two-column-layout pricing-fields">
                <Panel eyebrow="Korábbi időszak" title="Bázisköltségek">
                  <div className="field-grid two">
                    <NumberField
                      label="Anyagköltség"
                      value={pricing.previousMaterials}
                      onChange={(value) =>
                        setPricing({ ...pricing, previousMaterials: value })
                      }
                      suffix="Ft"
                      hint={pricingCostHint}
                    />
                    <NumberField
                      label="Összes többi kiadás"
                      value={pricing.previousOther}
                      onChange={(value) => setPricing({ ...pricing, previousOther: value })}
                      suffix="Ft"
                      hint={pricingCostHint}
                    />
                  </div>
                </Panel>
                <Panel eyebrow="Jelenlegi időszak" title="Aktuális költségek">
                  <div className="field-grid two">
                    <NumberField
                      label="Anyagköltség"
                      value={pricing.currentMaterials}
                      onChange={(value) =>
                        setPricing({ ...pricing, currentMaterials: value })
                      }
                      suffix="Ft"
                      hint={pricingCostHint}
                    />
                    <NumberField
                      label="Összes többi kiadás"
                      value={pricing.currentOther}
                      onChange={(value) => setPricing({ ...pricing, currentOther: value })}
                      suffix="Ft"
                      hint={pricingCostHint}
                    />
                  </div>
                </Panel>
              </div>
              <Panel eyebrow="Szolgáltatási ár" title="Mire alkalmazzuk a változást?">
                <div className="service-price-row">
                  <NumberField
                    label="Jelenlegi szolgáltatási ár"
                    value={pricing.currentServicePrice}
                    onChange={(value) => setPricing({ ...pricing, currentServicePrice: value })}
                    suffix="Ft"
                    hint="Nem kötelező. Ha megadod, kiszámoljuk belőle az új árat."
                  />
                  <div className="price-arrow">
                    <ArrowUpRight size={24} />
                  </div>
                  <div className="recommended-price">
                    <span>{t('Ajánlott új ár')}</span>
                    <strong>
                      {metrics.pricing.complete && metrics.pricing.hasServicePrice
                        ? formatFt(metrics.pricing.recommended)
                        : '—'}
                    </strong>
                    <small>
                      {t(
                        metrics.pricing.complete && metrics.pricing.hasServicePrice
                          ? 'kerekítés nélkül számolva'
                          : metrics.pricing.complete
                            ? 'Add meg a jelenlegi árat, ha az új összeget is látni szeretnéd.'
                            : 'Töltsd ki mindkét időszak anyagköltségét és az összes többi kiadást.',
                      )}
                    </small>
                  </div>
                </div>
              </Panel>
            </>
          )}

          {activeTab === 'pricelist' && (
            <>
              <div className="metric-grid two">
                <MetricCard
                  featured
                  label={
                    metrics.pricelist.fromProduction
                      ? 'Visszaszámolt óradíj'
                      : 'Kitermelendő óradíj'
                  }
                  value={moneyOrDash(metrics.pricelist.hourly)}
                  detail={
                    metrics.pricelist.fromProduction
                      ? 'a havi termelésből'
                      : metrics.pricelist.hourly &&
                          metrics.pricelist.occupancy < 100
                        ? `${metrics.pricelist.occupancy}% ${t('kihasználtsággal')}`
                        : 'választott óradíj'
                  }
                  note={
                    metrics.pricelist.hourly
                      ? undefined
                      : t(
                          metrics.pricelist.fromProduction
                            ? 'Add meg a munkatárs havi termelését és a munkaidejét, hogy legyen óradíj.'
                            : 'Először töltsd ki a választott kalkulátort, hogy legyen óradíj.',
                        )
                  }
                  icon={Clock3}
                />
                <MetricCard
                  label="Kitöltött szolgáltatások"
                  value={
                    metrics.pricelist.pricedCount
                      ? String(metrics.pricelist.pricedCount)
                      : '—'
                  }
                  detail="időtartammal megadva"
                  icon={Tags}
                />
              </div>
              <Panel eyebrow="Szolgáltatások" title="Árlista készítése">
                <div
                  className="pricelist-piles"
                  aria-label={t('Óradíj forrása')}
                >
                  <section
                    className={`switcher-pile${pricelistSource === 'solo' ? ' active' : ''}`}
                    aria-label={t('Egyéni működés')}
                  >
                    <div className="switcher-pile-heading">
                      <strong>{t('Egyéni működés')}</strong>
                    </div>
                    <div className="switcher-pile-tabs">
                      <button
                        type="button"
                        className={pricelistSource === 'solo' ? 'active' : ''}
                        aria-pressed={pricelistSource === 'solo'}
                        onClick={() => setPricelistSource('solo')}
                      >
                        {t('Egyéni')}
                      </button>
                    </div>
                  </section>
                  <section
                    className={`switcher-pile switcher-pile-team${pricelistSource !== 'solo' ? ' active' : ''}`}
                    aria-label={t('Többszemélyes működés')}
                  >
                    <div className="switcher-pile-heading">
                      <strong>{t('Többszemélyes működés')}</strong>
                    </div>
                    <div className="switcher-pile-tabs">
                      <button
                        type="button"
                        className={pricelistSource === 'owner' ? 'active' : ''}
                        aria-pressed={pricelistSource === 'owner'}
                        onClick={() => setPricelistSource('owner')}
                      >
                        {t('Saját')}
                      </button>
                      {employees.map((member) => (
                        <button
                          type="button"
                          className={
                            pricelistSource === 'employee' &&
                            pricelistEmployeeId === member.id
                              ? 'active'
                              : ''
                          }
                          aria-pressed={
                            pricelistSource === 'employee' &&
                            pricelistEmployeeId === member.id
                          }
                          onClick={() => {
                            setPricelistSource('employee')
                            setPricelistEmployeeId(member.id)
                          }}
                          key={member.id}
                        >
                          {employeeTitle(member.name) || t('Munkatárs')}
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
                <p className="panel-lead">
                  {t(
                    'A mostani árban általában már benne van a sampon, pakolás és a styling. Ha az anyag is drágult, az új anyagárat is írd be. Az ajánlott ár az óradíj × idő plusz az új anyag.',
                  )}
                </p>
                <OccupancyField
                  value={selectedPricelistWork.occupancy}
                  onChange={setSelectedPricelistOccupancy}
                />
                <p className="panel-lead">
                  {t(
                    'Az ajánlott ár a vendégnek mutatott, felfelé kerekített összeg. Alatta a pontos számolt érték látszik, ha eltér.',
                  )}
                </p>
                <ServiceEditor
                  services={services}
                  hourlyRate={metrics.pricelist.hourly}
                  materialFactor={metrics.pricelist.materialFactor}
                  personKey={pricelistPersonKey(
                    pricelistSource,
                    pricelistEmployeeId,
                  )}
                  onChange={setServices}
                />
              </Panel>
            </>
          )}
        </div>
      </main>
    </div>
    </LocaleContext.Provider>
  )
}
