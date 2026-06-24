/* =====================================================================
   内管マスター — 学習データ
   内部管理責任者資格試験（日本証券業協会）向け
   ---------------------------------------------------------------------
   ハイライト記法（学習パートの本文 HTML 内で使用）:
     <hot>…</hot>   = 🔥 試験で頻出のキーワード（赤系で点滅強調）
     <key>…</key>   = 重要語（黄マーカー）
     <num>…</num>   = 数字・要件（青バッジ）
   ポンチ絵は inline SVG（画像記憶を助けるシンプルな図解）。
   ===================================================================== */

const STUDY_DATA = {
  // 学習＋テストの単元
  units: [
    /* ============================ 単元1 ============================ */
    {
      id: "u1",
      title: "内部管理態勢の全体像",
      subtitle: "だれが・なにを管理する？",
      icon: "🏛️",
      color: "#5b8def",
      sections: [
        {
          heading: "内部管理態勢ってなに？",
          body: `
            <p><key>内部管理態勢</key>とは、協会員（証券会社）が
            <hot>法令・諸規則を守って適正に営業する</hot>ための社内の仕組みのこと。
            「ルール違反を未然に防ぎ、起きたら正す」見張り役の体制です。</p>
            <p>そのために、役割の違う3人の“管理する人”が登場します。
            まずは <hot>ピラミッドの形</hot> で覚えましょう。</p>`,
          diagram: "orgPyramid",
        },
        {
          heading: "3つの責任者を区別する 🔥最重要",
          body: `
            <ul class="cards">
              <li><span class="tag tag-blue">全社トップ</span>
                <b><hot>内部管理統括責任者</hot></b><br>
                会社<key>全体</key>の内部管理を統括。原則
                <num>社長に次ぐ職位以上の役員</num>が就任。
                違反があれば適正に処理する責任者。</li>
              <li><span class="tag tag-green">営業所ごと</span>
                <b><hot>内部管理責任者</hot></b><br>
                <key>営業所（支店）ごと</key>に設置。その営業所の営業活動が
                適正かを管理する<hot>非営業（牽制）</hot>の立場。</li>
              <li><span class="tag tag-orange">ライン側</span>
                <b>営業責任者</b><br>
                営業単位で投資勧誘などの<key>営業活動を指導・管理</key>する
                “営業ライン側”の責任者。</li>
            </ul>
            <p class="memo">💡 <b>ひっかけ注意</b>：内部管理責任者は
            「営業を指揮する人」ではなく、<hot>営業から独立した見張り役</hot>。
            営業責任者とは別人・別の立場です。</p>`,
          diagram: "checkBalance",
        },
        {
          heading: "資格と登録／補助責任者",
          body: `
            <p>内部管理統括責任者・内部管理責任者は、<key>所定の資格</key>を持ち
            <hot>協会へ登録</hot>される必要があります（だからこの試験がある！）。</p>
            <p><b>内部管理統括補助責任者</b>：内部管理統括責任者が
            <key>任意に任命</key>し、自らの責務の一部を担わせる者。</p>
            <p>これらのルールは協会の自主規制規則
            <key>「協会員の内部管理責任者等に関する規則」</key>が定めています。</p>`,
          diagram: null,
        },
      ],
      questions: [
        {
          type: "input",
          hot: true,
          q: "会社全体の内部管理態勢を統括し、原則として社長に次ぐ職位以上の役員が就く責任者を何という？",
          answers: ["内部管理統括責任者", "統括責任者"],
          explain: "全社を統括するのが内部管理統括責任者。社長に次ぐ職位以上の役員が原則。",
        },
        {
          type: "choice",
          hot: true,
          q: "営業所ごとに置かれ、その営業所の営業活動が適正かを管理する『非営業（牽制）』の立場の者は？",
          choices: ["内部管理責任者", "営業責任者", "内部管理統括責任者", "内部管理統括補助責任者"],
          answer: 0,
          explain: "営業所ごと＝内部管理責任者。営業から独立した牽制機能を担う。",
        },
        {
          type: "ox",
          q: "内部管理責任者は、営業活動を指揮・命令する営業ライン側の責任者である。",
          answer: false,
          explain: "×。内部管理責任者は営業から独立した非営業の牽制役。営業を指揮するのは営業責任者。",
        },
        {
          type: "ox",
          hot: true,
          q: "内部管理統括責任者は、原則として代表取締役社長に次ぐ職位以上の役員が就任する。",
          answer: true,
          explain: "○。全社統括にふさわしい高い職位の役員が就く。",
        },
        {
          type: "input",
          q: "投資勧誘などの営業活動を営業単位で指導・管理する『ライン側』の責任者を何という？",
          answers: ["営業責任者"],
          explain: "営業ライン側の管理者は営業責任者。内部管理責任者（牽制役）と区別。",
        },
        {
          type: "choice",
          q: "内部管理統括責任者が任意に任命し、自らの責務の一部を担わせる者は？",
          choices: ["内部管理統括補助責任者", "営業責任者", "内部管理責任者", "苦情処理責任者"],
          answer: 0,
          explain: "統括責任者を補助するのが内部管理統括補助責任者（任意に任命）。",
        },
        {
          type: "ox",
          q: "内部管理統括責任者・内部管理責任者は、所定の資格を有し協会に登録される必要がある。",
          answer: true,
          explain: "○。だからこそ資格試験と登録制度がある。",
        },
        {
          type: "choice",
          q: "内部管理責任者等の配置・資格・責務を定めている自主規制規則は？",
          choices: [
            "協会員の内部管理責任者等に関する規則",
            "金融商品取引法",
            "会社法",
            "取引所の受託契約準則",
          ],
          answer: 0,
          explain: "日本証券業協会の「協会員の内部管理責任者等に関する規則」が根拠。",
        },
      ],
    },

    /* ============================ 単元2 ============================ */
    {
      id: "u2",
      title: "投資勧誘の管理",
      subtitle: "お客様に合った勧誘を",
      icon: "🎯",
      color: "#23b26d",
      sections: [
        {
          heading: "適合性の原則 🔥最頻出",
          body: `
            <p><hot>適合性の原則</hot>＝顧客の
            <key>知識・経験・財産の状況・投資目的</key>に照らして
            <hot>不適当な勧誘をしてはならない</hot>。
            「その人に合わない商品を売りつけない」という大原則です。</p>
            <p>イメージは<key>フィルター</key>。顧客の属性を通して、
            合う商品だけを勧める。</p>`,
          diagram: "suitabilityFunnel",
        },
        {
          heading: "やってはいけない勧誘",
          body: `
            <ul class="cards">
              <li><b><hot>断定的判断の提供の禁止</hot></b><br>
                「<key>必ず上がる</key>」など、不確実な事項を断定的に
                告げて勧誘してはダメ。</li>
              <li><b><hot>不招請勧誘の禁止</hot></b><br>
                顧客の<key>要請がない</key>のに、店頭デリバティブ等の
                訪問・電話勧誘をしてはダメ。</li>
              <li><b>再勧誘の禁止</b><br>
                「契約しない」と<key>意思表示した顧客</key>に
                勧誘を続けてはダメ。</li>
            </ul>`,
          diagram: "forbidTalk",
        },
        {
          heading: "高齢顧客への勧誘 🔥頻出",
          body: `
            <p>高齢顧客は判断力等に配慮が必要。
            <hot>社内ルール（ガイドライン）に基づき慎重に</hot>行います。</p>
            <ul>
              <li>対象となる<key>年齢・勧誘できる商品</key>を社内で定める</li>
              <li><hot>役席者の事前承認</hot>を得る</li>
              <li>受注後の<key>連絡・確認</key>など丁寧な手続</li>
            </ul>
            <p class="memo">💡 高齢顧客は「絶対に勧誘禁止」ではなく
            <hot>“慎重な手続のもとで可”</hot>。ここがひっかけ。</p>`,
          diagram: null,
        },
      ],
      questions: [
        {
          type: "input",
          hot: true,
          q: "顧客の知識・経験・財産の状況・投資目的に照らして不適当な勧誘を行ってはならない、という原則は？",
          answers: ["適合性の原則", "適合性原則"],
          explain: "投資勧誘の大原則＝適合性の原則。",
        },
        {
          type: "ox",
          hot: true,
          q: "「この株は必ず値上がりします」と説明して勧誘することは認められる。",
          answer: false,
          explain: "×。断定的判断の提供にあたり禁止。",
        },
        {
          type: "input",
          hot: true,
          q: "「必ず儲かる」等、不確実な事項を断定的に告げて勧誘することの禁止を何という？",
          answers: ["断定的判断の提供の禁止", "断定的判断の提供", "断定的判断"],
          explain: "断定的判断の提供の禁止。将来の不確実な事を言い切ってはいけない。",
        },
        {
          type: "ox",
          q: "顧客から要請がないのに、店頭デリバティブ取引の訪問・電話による勧誘を行うことは禁止されている。",
          answer: true,
          explain: "○。不招請勧誘の禁止。",
        },
        {
          type: "choice",
          q: "契約しない旨の意思表示をした顧客に勧誘を続けることを何の禁止という？",
          choices: ["再勧誘の禁止", "不招請勧誘の禁止", "断定的判断の提供の禁止", "損失補填の禁止"],
          answer: 0,
          explain: "断った顧客への勧誘継続＝再勧誘の禁止。",
        },
        {
          type: "choice",
          hot: true,
          q: "高齢顧客への勧誘として最も適切なのは？",
          choices: [
            "社内ルールに基づき、役席者の事前承認等を得て慎重に行う",
            "高齢者には一切勧誘してはならない",
            "本人の同意があれば手続なしで自由に勧誘してよい",
            "家族の同意があれば商品の制限なく勧誘してよい",
          ],
          answer: 0,
          explain: "“一切禁止”でも“自由”でもなく、社内ガイドラインに沿って慎重に。",
        },
        {
          type: "ox",
          q: "適合性の原則は、顧客の意向と実情に適合した勧誘を求めるものである。",
          answer: true,
          explain: "○。顧客に合った勧誘を求める原則。",
        },
      ],
    },

    /* ============================ 単元3 ============================ */
    {
      id: "u3",
      title: "顧客管理と禁止行為",
      subtitle: "お金まわりの“越えてはいけない一線”",
      icon: "🚫",
      color: "#e0467c",
      sections: [
        {
          heading: "損失補填等の禁止 🔥最頻出",
          body: `
            <p><hot>損失補填等の禁止</hot>＝顧客に対する
            <key>損失保証・利益保証・損失補填・特別の利益の提供</key>はすべて禁止。</p>
            <ul>
              <li><hot>約束（事前）も実行（事後）も</hot>両方ダメ</li>
              <li><key>第三者を通じて</key>行ってもダメ</li>
              <li>顧客側が要求・受領するのもダメ</li>
            </ul>`,
          diagram: "noCompensation",
        },
        {
          heading: "唯一の例外＝「事故」",
          body: `
            <p>損失補填が例外的に認められるのは<hot>「事故」</hot>のとき。
            事故＝<key>協会員（役職員）の違法・不当な行為</key>で顧客に損失を
            与えた場合（誤発注など）。</p>
            <p>このときも勝手にはできず、原則
            <hot>協会（日本証券業協会）の確認</hot>という手続が必要です。</p>
            <p class="memo">💡 「相場が下がった分の穴埋め」は事故ではない＝補填NG。
            “会社側のミス”だけが事故。</p>`,
          diagram: null,
        },
        {
          heading: "名義貸し・顧客カード",
          body: `
            <ul class="cards">
              <li><b><hot>名義貸しの禁止</hot></b><br>
                自己の名義を他人に貸して取引させる／他人の名義を借りる行為の禁止。</li>
              <li><b><key>顧客カード</key></b><br>
                氏名・住所・職業・<key>投資目的・資産・投資経験</key>等を記載し、
                顧客管理に使う基本書類。</li>
            </ul>`,
          diagram: null,
        },
      ],
      questions: [
        {
          type: "input",
          hot: true,
          q: "顧客に対する損失保証・利益保証や事後の損失補填、特別の利益の提供を行うことの禁止を何という？",
          answers: ["損失補填等の禁止", "損失補填の禁止", "損失補てん等の禁止", "損失補てんの禁止"],
          explain: "損失補填等の禁止。約束も実行も、第三者経由もすべてNG。",
        },
        {
          type: "ox",
          hot: true,
          q: "事前に補填を約束していなければ、顧客に損失が出た後に損失を補填することは問題ない。",
          answer: false,
          explain: "×。事後の補填も禁止。約束の有無を問わずダメ。",
        },
        {
          type: "ox",
          q: "自己の名義を他人に貸して有価証券の取引をさせることは禁止されている。",
          answer: true,
          explain: "○。名義貸しの禁止。",
        },
        {
          type: "choice",
          hot: true,
          q: "損失補填が例外的に認められる「事故」に該当するのは？",
          choices: [
            "協会員（役職員）の違法・不当な行為により顧客に損失を与えた場合",
            "相場全体が下落して顧客に損失が出た場合",
            "顧客が自分の判断で売買して損をした場合",
            "顧客が手数料の高さに不満を持っている場合",
          ],
          answer: 0,
          explain: "事故＝会社側のミス・違法不当行為。相場下落は事故ではない。",
        },
        {
          type: "input",
          q: "顧客の氏名・投資目的・資産・投資経験等を記載し、顧客管理に用いる基本書類は？",
          answers: ["顧客カード"],
          explain: "顧客カード。適合性判断の基礎資料にもなる。",
        },
        {
          type: "ox",
          q: "特別の利益の提供を約束して顧客を勧誘することは認められる。",
          answer: false,
          explain: "×。特別の利益の提供（約束）も禁止。",
        },
        {
          type: "choice",
          q: "事故による損失補填を行うために原則として必要なのは？",
          choices: [
            "協会（日本証券業協会）の確認",
            "顧客の家族の同意",
            "内部管理責任者だけの判断",
            "特に手続は不要",
          ],
          answer: 0,
          explain: "事故補填には原則として協会の確認が必要。",
        },
      ],
    },

    /* ============================ 単元4 ============================ */
    {
      id: "u4",
      title: "金融商品取引法の重要ルール",
      subtitle: "説明する・書面で渡す",
      icon: "📜",
      color: "#8b5cf6",
      sections: [
        {
          heading: "誠実公正義務と説明義務",
          body: `
            <p><hot>誠実公正義務</hot>＝顧客に対し
            <key>誠実かつ公正に</key>業務を行う、すべての土台となる義務。</p>
            <p>そのうえで、商品のリスク等の<hot>重要事項を説明する義務</hot>を負います。
            「黙って売る」は許されません。</p>`,
          diagram: "explainDoc",
        },
        {
          heading: "契約締結前交付書面 🔥頻出",
          body: `
            <p><hot>契約締結前交付書面</hot>＝契約を結ぶ<hot>前にあらかじめ</hot>
            顧客へ交付する書面。</p>
            <ul>
              <li>記載：<key>手数料・リスク・クーリングオフ</key>等の重要事項</li>
              <li>タイミングは<hot>“締結前”</hot>（後で渡すのはNG）</li>
            </ul>
            <p>契約成立後にも<key>契約締結時交付書面</key>を交付します。</p>
            <p class="memo">💡 ひっかけ：「契約後すみやかに交付すればよい」は×。
            前者は<b>あらかじめ＝締結前</b>。</p>`,
          diagram: null,
        },
        {
          heading: "広告規制・分別管理・最良執行",
          body: `
            <ul class="cards">
              <li><b><hot>広告等の規制</hot></b><br>
                リスク等を明瞭・正確に表示。
                <key>誇大広告（著しく事実に相違する表示）の禁止</key>。</li>
              <li><b><key>分別管理</key></b><br>
                顧客の金銭・有価証券を<hot>自己の財産と区別</hot>して管理。</li>
              <li><b>最良執行義務</b><br>
                顧客にとって<key>最良の条件</key>で注文を執行するよう努める。</li>
            </ul>`,
          diagram: null,
        },
      ],
      questions: [
        {
          type: "input",
          q: "顧客に対し誠実かつ公正に業務を遂行しなければならない義務を何という？",
          answers: ["誠実公正義務", "誠実・公正義務"],
          explain: "すべての業務の土台＝誠実公正義務。",
        },
        {
          type: "ox",
          hot: true,
          q: "契約締結前交付書面は、契約が成立した後すみやかに顧客へ交付すればよい。",
          answer: false,
          explain: "×。“締結前にあらかじめ”交付するのが契約締結前交付書面。",
        },
        {
          type: "choice",
          hot: true,
          q: "契約締結前交付書面に記載が求められる重要事項は？",
          choices: [
            "手数料・リスク・クーリングオフ等",
            "社員の個人的見解のみ",
            "過去の必勝法",
            "会社の役員名簿",
          ],
          answer: 0,
          explain: "手数料・リスク・クーリングオフ等の重要事項を事前に伝える。",
        },
        {
          type: "ox",
          q: "利益の見込み等について著しく事実に相違する表示（誇大広告）は禁止されている。",
          answer: true,
          explain: "○。広告等の規制（誇大広告の禁止）。",
        },
        {
          type: "input",
          q: "顧客から預かった金銭・有価証券を自己の財産と区別して管理することを何という？",
          answers: ["分別管理"],
          explain: "分別管理。会社が破綻しても顧客資産を守る仕組み。",
        },
        {
          type: "choice",
          q: "顧客にとって最も有利な条件で注文を執行するよう努める義務は？",
          choices: ["最良執行義務", "分別管理義務", "誠実公正義務", "説明義務"],
          answer: 0,
          explain: "最良執行義務。最良執行方針等を定め公表する。",
        },
        {
          type: "ox",
          q: "金融商品取引業者は、顧客に対しリスク等の重要事項を説明する義務を負う。",
          answer: true,
          explain: "○。説明義務。黙って売ることは許されない。",
        },
      ],
    },

    /* ============================ 単元5 ============================ */
    {
      id: "u5",
      title: "不公正取引の規制",
      subtitle: "やったら一発アウト",
      icon: "⚖️",
      color: "#ef5350",
      sections: [
        {
          heading: "インサイダー取引（内部者取引）🔥最頻出",
          body: `
            <p><hot>インサイダー取引</hot>＝<key>会社関係者</key>が、職務等に関し
            <key>重要事実</key>を知り、それが<hot>公表される前</hot>に
            その会社の株式等を売買すること等の禁止。</p>
            <ul>
              <li><b>重要事実</b>：<key>決定事実・発生事実・決算情報</key>など
                （広く“株価に影響する未公表情報”）</li>
              <li><b>会社関係者</b>：役職員・大株主・契約相手など。
                伝達を受けた者＝<key>情報受領者</key>も規制対象</li>
            </ul>`,
          diagram: "insider",
        },
        {
          heading: "「公表」されたといえるのは？",
          body: `
            <p>重要事実が<hot>公表</hot>されたといえるのは…</p>
            <ul>
              <li><num>2以上の報道機関</num>に公開され
                <hot>12時間が経過</hot>した（いわゆる12時間ルール）</li>
              <li>取引所の<key>適時開示（TDnet）</key>に掲載された</li>
              <li><key>EDINET</key>に記載され公衆縦覧された　など</li>
            </ul>
            <p class="memo">💡 数字の<b>「2以上」「12時間」</b>はそのまま出る！</p>`,
          diagram: null,
        },
        {
          heading: "相場操縦・風説の流布",
          body: `
            <ul class="cards">
              <li><b><hot>相場操縦の禁止</hot></b><br>
                取引を誘引する目的での<key>仮装売買・馴合売買</key>や
                現実売買による相場操縦。</li>
              <li><b>風説の流布・偽計の禁止</b><br>
                株価に影響する<key>虚偽の情報（風説）</key>を流す行為の禁止。</li>
            </ul>`,
          diagram: null,
        },
      ],
      questions: [
        {
          type: "input",
          hot: true,
          q: "会社関係者が重要事実を職務等に関し知り、公表前にその会社の株式等を売買すること等の禁止を何という？",
          answers: ["インサイダー取引", "内部者取引", "インサイダー取引規制", "インサイダー取引の禁止"],
          explain: "インサイダー取引（内部者取引）の規制。",
        },
        {
          type: "ox",
          hot: true,
          q: "重要事実が「公表」されたといえるのは、2以上の報道機関に公開され12時間が経過した場合等である。",
          answer: true,
          explain: "○。いわゆる12時間ルール。TDnet掲載やEDINET縦覧でも公表となる。",
        },
        {
          type: "choice",
          hot: true,
          q: "インサイダー取引規制の「重要事実」に含まれるものは？",
          choices: [
            "合併等の決定事実・災害等の発生事実・決算情報のいずれも含む",
            "決定事実のみ",
            "決算情報は含まれない",
            "公表済みの新聞報道",
          ],
          answer: 0,
          explain: "決定事実・発生事実・決算情報など広く含む（バスケット条項もある）。",
        },
        {
          type: "choice",
          q: "会社関係者から重要事実の伝達を受けて取引した者を何という？",
          choices: ["情報受領者", "公開買付者", "適格機関投資家", "登録金融機関"],
          answer: 0,
          explain: "伝達を受けた者＝情報受領者（第一次情報受領者）も規制対象。",
        },
        {
          type: "ox",
          q: "取引を誘引する目的で、仮装売買や馴合売買を行うことは相場操縦として禁止されている。",
          answer: true,
          explain: "○。相場操縦の禁止。",
        },
        {
          type: "input",
          q: "取引を誘引する目的で仮装売買・馴合売買などにより相場を人為的に操作する行為の禁止を何という？",
          answers: ["相場操縦の禁止", "相場操縦"],
          explain: "相場操縦の禁止。仮装・馴合・現実売買による操作。",
        },
        {
          type: "ox",
          q: "株価に影響を与える虚偽の情報（風説）を流す行為は禁止されている。",
          answer: true,
          explain: "○。風説の流布・偽計の禁止。",
        },
      ],
    },

    /* ============================ 単元6 ============================ */
    {
      id: "u6",
      title: "協会・取引所規則と苦情処理",
      subtitle: "従業員ルールとトラブル対応",
      icon: "🤝",
      color: "#f59e0b",
      sections: [
        {
          heading: "従業員の禁止行為",
          body: `
            <ul class="cards">
              <li><b><hot>顧客との金銭の貸借の禁止</hot></b><br>
                従業員が顧客とお金の貸し借りをしてはダメ。</li>
              <li><b><hot>無断売買の禁止</hot></b><br>
                顧客の注文によらず勝手に売買してはダメ。</li>
              <li><b>過当取引の禁止</b><br>
                手数料稼ぎ目的の頻繁な売買（チャーニング）はダメ。</li>
            </ul>`,
          diagram: null,
        },
        {
          heading: "法人関係情報とチャイニーズ・ウォール",
          body: `
            <p><hot>法人関係情報</hot>＝会社の運営・業務・財産に関する
            <key>公表されていない重要情報</key>（インサイダーの“タネ”）。</p>
            <p>これが営業部門へ漏れないよう、部門間に
            <hot>情報隔壁（チャイニーズ・ウォール）</hot>を設けて管理します。</p>`,
          diagram: "wall",
        },
        {
          heading: "苦情・トラブルの処理",
          body: `
            <ul>
              <li>顧客の<key>苦情</key>は社内できちんと記録・処理</li>
              <li>解決しないトラブルは、協会の
                <hot>あっせん（FINMAC）</hot>という裁判外紛争解決(ADR)を利用</li>
              <li><key>反社会的勢力</key>との取引は排除する</li>
            </ul>`,
          diagram: null,
        },
      ],
      questions: [
        {
          type: "ox",
          q: "従業員が顧客と金銭の貸借（貸し借り）を行うことは禁止されている。",
          answer: true,
          explain: "○。顧客との金銭貸借の禁止。",
        },
        {
          type: "input",
          q: "顧客の注文によらず、従業員が勝手に売買することを何という？",
          answers: ["無断売買"],
          explain: "無断売買。顧客の注文が大前提。",
        },
        {
          type: "choice",
          q: "証券取引に関する顧客とのトラブル解決のため協会が提供する裁判外紛争解決(ADR)は？",
          choices: ["あっせん（FINMAC）", "強制執行", "刑事告訴", "株主代表訴訟"],
          answer: 0,
          explain: "FINMACのあっせん（ADR）でトラブルを解決。",
        },
        {
          type: "ox",
          hot: true,
          q: "法人関係情報を扱う部門と営業部門の間に、情報隔壁（チャイニーズ・ウォール）を設ける必要がある。",
          answer: true,
          explain: "○。情報の不正利用を防ぐための情報隔壁。",
        },
        {
          type: "input",
          q: "会社の運営・業務・財産に関する、公表されていない重要な情報を何という？",
          answers: ["法人関係情報"],
          explain: "法人関係情報。インサイダー取引の“タネ”になるため厳格に管理。",
        },
        {
          type: "ox",
          q: "反社会的勢力との取引は排除しなければならない。",
          answer: true,
          explain: "○。反社会的勢力の排除は協会員の重要な責務。",
        },
        {
          type: "choice",
          q: "手数料稼ぎを目的に顧客口座で過度に頻繁な売買を繰り返す行為を何という？",
          choices: ["過当取引（チャーニング）", "分別管理", "適時開示", "最良執行"],
          answer: 0,
          explain: "過当取引（チャーニング）。顧客の利益を損なう禁止行為。",
        },
      ],
    },
  ],
};

/* ===== ポンチ絵（inline SVG）＝画像記憶アシスト ===== */
const DIAGRAMS = {
  orgPyramid: `
    <svg viewBox="0 0 320 200" class="ponchi">
      <polygon points="160,12 250,70 70,70" fill="#5b8def"/>
      <rect x="70" y="74" width="180" height="40" rx="6" fill="#23b26d"/>
      <rect x="40" y="118" width="110" height="34" rx="6" fill="#f59e0b"/>
      <rect x="170" y="118" width="110" height="34" rx="6" fill="#f59e0b"/>
      <text x="160" y="52" class="t-w" text-anchor="middle" font-size="13">統括責任者</text>
      <text x="160" y="99" class="t-w" text-anchor="middle" font-size="12">内部管理責任者</text>
      <text x="95" y="139" class="t-w" text-anchor="middle" font-size="11">営業所A</text>
      <text x="225" y="139" class="t-w" text-anchor="middle" font-size="11">営業所B</text>
      <text x="160" y="185" text-anchor="middle" font-size="11" fill="#888">全社→営業所ごとに見張る</text>
    </svg>`,
  checkBalance: `
    <svg viewBox="0 0 320 170" class="ponchi">
      <rect x="30" y="40" width="110" height="60" rx="10" fill="#f59e0b"/>
      <rect x="180" y="40" width="110" height="60" rx="10" fill="#23b26d"/>
      <text x="85" y="68" class="t-w" text-anchor="middle" font-size="13">営業ライン</text>
      <text x="85" y="88" class="t-w" text-anchor="middle" font-size="11">売る人</text>
      <text x="235" y="68" class="t-w" text-anchor="middle" font-size="13">内部管理</text>
      <text x="235" y="88" class="t-w" text-anchor="middle" font-size="11">見張る人</text>
      <line x1="140" y1="70" x2="180" y2="70" stroke="#e0467c" stroke-width="4"/>
      <polygon points="180,70 168,64 168,76" fill="#e0467c"/>
      <text x="160" y="130" text-anchor="middle" font-size="13" fill="#e0467c">牽制（チェック）</text>
    </svg>`,
  suitabilityFunnel: `
    <svg viewBox="0 0 320 190" class="ponchi">
      <text x="160" y="22" text-anchor="middle" font-size="12" fill="#888">顧客に合う？でフィルター</text>
      <polygon points="60,40 260,40 200,110 120,110" fill="#23b26d" opacity="0.85"/>
      <text x="160" y="78" class="t-w" text-anchor="middle" font-size="13">適合性チェック</text>
      <circle cx="100" cy="150" r="20" fill="#5b8def"/>
      <text x="100" y="155" class="t-w" text-anchor="middle" font-size="11">適</text>
      <circle cx="220" cy="150" r="20" fill="#bbb"/>
      <text x="220" y="155" class="t-w" text-anchor="middle" font-size="11">不適</text>
      <line x1="190" y1="135" x2="250" y2="165" stroke="#e0467c" stroke-width="4"/>
    </svg>`,
  forbidTalk: `
    <svg viewBox="0 0 320 160" class="ponchi">
      <circle cx="70" cy="80" r="34" fill="#f59e0b"/>
      <text x="70" y="86" class="t-w" text-anchor="middle" font-size="22">🗣️</text>
      <rect x="135" y="50" width="150" height="60" rx="14" fill="#fff" stroke="#ef5350" stroke-width="2"/>
      <text x="210" y="78" text-anchor="middle" font-size="12" fill="#333">「必ず上がる！」</text>
      <text x="210" y="96" text-anchor="middle" font-size="11" fill="#333">断定はダメ</text>
      <line x1="150" y1="50" x2="270" y2="110" stroke="#ef5350" stroke-width="5"/>
    </svg>`,
  noCompensation: `
    <svg viewBox="0 0 320 160" class="ponchi">
      <rect x="30" y="55" width="90" height="50" rx="10" fill="#5b8def"/>
      <text x="75" y="85" class="t-w" text-anchor="middle" font-size="13">会社</text>
      <rect x="200" y="55" width="90" height="50" rx="10" fill="#23b26d"/>
      <text x="245" y="85" class="t-w" text-anchor="middle" font-size="13">顧客</text>
      <text x="160" y="70" text-anchor="middle" font-size="22">💴</text>
      <line x1="125" y1="80" x2="195" y2="80" stroke="#888" stroke-width="3" stroke-dasharray="6 4"/>
      <line x1="120" y1="45" x2="200" y2="115" stroke="#ef5350" stroke-width="6"/>
      <text x="160" y="140" text-anchor="middle" font-size="13" fill="#ef5350">損失補填は禁止</text>
    </svg>`,
  explainDoc: `
    <svg viewBox="0 0 320 160" class="ponchi">
      <rect x="40" y="40" width="80" height="90" rx="6" fill="#fff" stroke="#8b5cf6" stroke-width="3"/>
      <line x1="55" y1="60" x2="105" y2="60" stroke="#8b5cf6" stroke-width="3"/>
      <line x1="55" y1="74" x2="105" y2="74" stroke="#c4b5fd" stroke-width="3"/>
      <line x1="55" y1="88" x2="105" y2="88" stroke="#c4b5fd" stroke-width="3"/>
      <text x="225" y="60" text-anchor="middle" font-size="22">🗣️</text>
      <rect x="150" y="75" width="150" height="48" rx="12" fill="#ede9fe"/>
      <text x="225" y="96" text-anchor="middle" font-size="11" fill="#5b21b6">リスク・手数料を</text>
      <text x="225" y="112" text-anchor="middle" font-size="11" fill="#5b21b6">きちんと説明</text>
    </svg>`,
  insider: `
    <svg viewBox="0 0 320 175" class="ponchi">
      <circle cx="70" cy="60" r="30" fill="#5b8def"/>
      <text x="70" y="66" class="t-w" text-anchor="middle" font-size="20">🤫</text>
      <text x="70" y="108" text-anchor="middle" font-size="11" fill="#666">会社関係者</text>
      <rect x="125" y="42" width="86" height="36" rx="8" fill="#fde68a"/>
      <text x="168" y="65" text-anchor="middle" font-size="11" fill="#92400e">未公表の重要事実</text>
      <text x="265" y="55" text-anchor="middle" font-size="24">📈</text>
      <text x="265" y="80" text-anchor="middle" font-size="11" fill="#666">公表前に売買</text>
      <line x1="100" y1="60" x2="125" y2="60" stroke="#888" stroke-width="3"/>
      <line x1="211" y1="60" x2="240" y2="60" stroke="#888" stroke-width="3"/>
      <rect x="95" y="120" width="130" height="38" rx="8" fill="#ef5350"/>
      <text x="160" y="144" class="t-w" text-anchor="middle" font-size="14">禁止！</text>
    </svg>`,
  wall: `
    <svg viewBox="0 0 320 160" class="ponchi">
      <rect x="30" y="50" width="100" height="60" rx="10" fill="#fde68a"/>
      <text x="80" y="76" text-anchor="middle" font-size="11" fill="#92400e">法人関係情報</text>
      <text x="80" y="94" text-anchor="middle" font-size="11" fill="#92400e">を扱う部門</text>
      <rect x="152" y="30" width="16" height="100" rx="3" fill="#64748b"/>
      <text x="160" y="150" text-anchor="middle" font-size="11" fill="#64748b">壁</text>
      <rect x="190" y="50" width="100" height="60" rx="10" fill="#bbf7d0"/>
      <text x="240" y="84" text-anchor="middle" font-size="11" fill="#166534">営業部門</text>
      <text x="160" y="18" text-anchor="middle" font-size="11" fill="#888">チャイニーズ・ウォール</text>
    </svg>`,
};
