/**
 * parsha-content.js — for each week's Torah portion, what the Shabbat print sheet
 * shows at the table and in the kids' corner:
 *   summary    — the parsha in a few lines
 *   quote      — { text, ref } a verse from it
 *   thought    — a short reflection
 *   questions  — for discussion at the table
 *   kids       — { title, story, word: { word, meaning, emoji }, questions, draw }
 *
 * Written for beginners and families; like everything here, a starting point for
 * learning — the content still needs review by a rabbi.
 *
 * Keys are the portion names as Hebcal spells them, matched loosely (see
 * parshaContent): "Beha’alotcha", "Behaalotcha" and "beha'alotcha" all find the same
 * entry. Double portions ("Matot-Masei") are found by their parts.
 */

const PARSHA_CONTENT = {
  // ---------------------------------------------------------------- Genesis
  "Bereshit": {
    summary: "The Torah begins with creation: in six days God makes light, sky, land, plants, stars, animals — and people, created in God's image — and on the seventh day God rests, making Shabbat holy. Adam and Eve live in the Garden of Eden until they eat from the forbidden tree. Their sons Cain and Abel bring offerings, and Cain kills his brother in jealousy.",
    quote: { text: "In the beginning God created the heavens and the earth.", ref: "Genesis 1:1" },
    thought: "Every person is created in the image of God — the person across the table, too. Shabbat is the Torah's first holy thing: not a place, but a time.",
    questions: ["What does it mean to you that every person is made in God's image?", "God 'rested' on the seventh day. What helps you truly rest?", "Cain asked, 'Am I my brother's keeper?' What would you answer him?"],
    kids: {
      title: "God makes the world!",
      story: "In the very beginning, God made the whole world in six days — light, sky, oceans, trees, sun, moon, stars, fish, birds, animals, and the first people, Adam and Eve. On the seventh day, God rested. That's the very first Shabbat!",
      word: { word: "Shabbat", meaning: "the day of rest", emoji: "🕯️" },
      questions: ["What did God make on the very first day?", "What happened on the seventh day?", "What's your favorite thing God made?"],
      draw: "Draw your favorite day of creation."
    }
  },
  "Noach": {
    summary: "The world fills with violence, but Noah is righteous. God tells him to build an ark and bring his family and two of every animal inside before a great flood. After the waters go down, God promises never to destroy the world by flood again and sets a rainbow in the sky as a sign. Later, people build the Tower of Babel to make a name for themselves, and their language is scattered.",
    quote: { text: "Noah walked with God.", ref: "Genesis 6:9" },
    thought: "Noah stayed good when everyone around him didn't. The rainbow reminds us that after every storm, God's promise holds.",
    questions: ["What does it take to do the right thing when no one else is?", "What's a 'rainbow' — a sign of hope — you've seen after a hard time?", "Why do you think the builders of the tower wanted to 'make a name' for themselves?"],
    kids: {
      title: "All aboard Noah's ark!",
      story: "Noah built a giant boat called an ark. Into the ark went Noah's family and two of every kind of animal — lions, giraffes, even tiny ants! It rained and rained for forty days. When it stopped, a dove brought back an olive leaf, and God put a beautiful rainbow in the sky as a promise.",
      word: { word: "Teivah", meaning: "the ark (a big boat)", emoji: "🚢" },
      questions: ["How many of each animal went into the ark?", "What did the dove bring back?", "What did God put in the sky as a promise?"],
      draw: "Draw the ark full of animals — and the rainbow."
    }
  },
  "Lech-Lecha": {
    summary: "God tells Abram to leave his land and his father's house and go to the land God will show him, promising that he will become a great nation and a blessing. Abram and Sarai travel to Canaan, go down to Egypt in a famine, and return. Abram rescues his nephew Lot, and God makes a covenant with him, promising children as many as the stars. Their names become Abraham and Sarah.",
    quote: { text: "Go forth from your land… and you shall be a blessing.", ref: "Genesis 12:1–2" },
    thought: "Abraham's journey began with a step into the unknown. Many of us have taken our own 'lech lecha' — leaving what we knew to find who we are meant to be.",
    questions: ["When did you take a brave step into something new?", "What does it mean to 'be a blessing' to others?", "God changed Abram's and Sarai's names. Has a new chapter ever changed who you are?"],
    kids: {
      title: "Abraham's big journey",
      story: "God said to Abraham: 'Pack your things and go to a new land that I will show you!' Abraham and Sarah said goodbye to their home and set off on a long trip. God took Abraham outside at night and said: 'Count the stars — that's how big your family will be!'",
      word: { word: "Lech Lecha", meaning: "go for yourself", emoji: "🧳" },
      questions: ["Who went on the journey with Abraham?", "What did God ask Abraham to count?", "Have you ever moved somewhere new? How did it feel?"],
      draw: "Draw Abraham under a sky full of stars."
    }
  },
  "Vayera": {
    summary: "Abraham welcomes three strangers into his tent — angels who announce that Sarah will have a son. Abraham argues with God to save the cities of Sodom and Gomorrah. Isaac is born, and Sarah laughs with joy. Finally, God tests Abraham by asking him to bring Isaac as an offering — and stops him at the last moment.",
    quote: { text: "Is anything too wondrous for the Lord?", ref: "Genesis 18:14" },
    thought: "Abraham ran to welcome strangers on a hot day, even while he was recovering. Hospitality — hachnasat orchim — is one of the oldest Jewish mitzvot, and the Shabbat table is its home.",
    questions: ["Who could you invite to your Shabbat table?", "Abraham argued with God for strangers in Sodom. When is it right to speak up?", "Sarah laughed when she heard the news. What surprised you with joy?"],
    kids: {
      title: "Abraham welcomes guests",
      story: "It was a hot, hot day. Abraham sat at the door of his tent and saw three travelers. He ran to greet them, brought water to wash their feet, and gave them a delicious meal. The guests were really angels, and they had amazing news: Sarah would have a baby named Isaac!",
      word: { word: "Hachnasat Orchim", meaning: "welcoming guests", emoji: "🏕️" },
      questions: ["What did Abraham give his guests?", "What good news did the guests bring?", "How can you make a guest feel welcome?"],
      draw: "Draw Abraham's tent with its doors open to everyone."
    }
  },
  "Chayei Sara": {
    summary: "Sarah dies, and Abraham buys the Cave of Machpelah in Hebron to bury her. He sends his servant to find a wife for Isaac. At a well, the servant prays for a sign — and Rebecca kindly offers water to him and to all his camels. She agrees to go, and Isaac loves her and is comforted after his mother's death.",
    quote: { text: "Abraham was old, well along in years, and the Lord had blessed Abraham in all things.", ref: "Genesis 24:1" },
    thought: "Rebecca was chosen not for her wealth but for her kindness — watering ten thirsty camels without being asked. Small acts of kindness reveal who we really are.",
    questions: ["What small act of kindness did someone do for you this week?", "Why do you think kindness was the sign the servant looked for?", "How do you remember people you've loved and lost?"],
    kids: {
      title: "Rebecca and the camels",
      story: "Abraham's servant went to find a wife for Isaac. He stopped at a well with ten thirsty camels. A girl named Rebecca came and said: 'Drink, and I'll give water to your camels too!' She carried bucket after bucket. The servant knew: this kind girl is the one!",
      word: { word: "Chesed", meaning: "kindness", emoji: "🐪" },
      questions: ["How many camels did Rebecca give water to?", "Why did the servant choose Rebecca?", "What kind thing can you do this Shabbat?"],
      draw: "Draw Rebecca giving water to the camels."
    }
  },
  "Toldot": {
    summary: "Isaac and Rebecca have twins: Esau, a hunter, and Jacob, a quiet man of the tents. Esau sells his birthright to Jacob for a bowl of lentil stew. When Isaac is old and blind, Rebecca helps Jacob disguise himself as Esau to receive his father's blessing, and Jacob must flee from his angry brother.",
    quote: { text: "The voice is the voice of Jacob, but the hands are the hands of Esau.", ref: "Genesis 27:22" },
    thought: "Two brothers, very different from birth. The Torah doesn't hide family struggles — it shows that each child has their own path and their own blessing.",
    questions: ["How are the people in your family different from each other?", "Esau traded something precious for something he wanted right now. Have you ever done that?", "What blessing would you give someone at this table?"],
    kids: {
      title: "The twins Jacob and Esau",
      story: "Rebecca had twin boys who were very different! Esau loved to hunt outside, and Jacob liked to stay in the tents and learn. One day Esau came home very hungry and traded his special 'big brother' rights for a bowl of red lentil soup!",
      word: { word: "Bracha", meaning: "a blessing", emoji: "🍲" },
      questions: ["What were the twins' names?", "What did Esau trade for a bowl of soup?", "How are you different from your brother, sister or friend?"],
      draw: "Draw the bowl of red lentil soup."
    }
  },
  "Vayetzei": {
    summary: "Jacob flees from Esau. On the way he dreams of a ladder reaching to heaven with angels going up and down, and God promises to protect him. At Haran he falls in love with Rachel and works seven years for her, but her father Laban tricks him into marrying Leah first. Jacob's family grows to eleven sons and a daughter, and after twenty years he heads home.",
    quote: { text: "Surely the Lord is in this place, and I did not know it.", ref: "Genesis 28:16" },
    thought: "Jacob found God on a lonely night on a hard stone pillow. Holiness can be found anywhere — even in places we least expect.",
    questions: ["Where have you unexpectedly felt something holy?", "Jacob worked fourteen years for love. What is worth waiting for?", "How do you handle it when someone is unfair to you, like Laban was to Jacob?"],
    kids: {
      title: "Jacob's dream",
      story: "Jacob was traveling alone and fell asleep with a rock for a pillow. He dreamed of a giant ladder reaching all the way up to the sky, with angels climbing up and down! God said: 'I am with you, and I will watch over you wherever you go.'",
      word: { word: "Sulam", meaning: "a ladder", emoji: "🪜" },
      questions: ["What did Jacob use as a pillow?", "Who was climbing up and down the ladder?", "What did God promise Jacob?"],
      draw: "Draw Jacob's ladder with angels on it."
    }
  },
  "Vayishlach": {
    summary: "Jacob comes home after twenty years away. Afraid of meeting his brother Esau, he prays, sends gifts — and that night wrestles with a mysterious stranger until dawn. He is hurt, but he doesn't let go, and he receives a new name: Israel, 'one who struggles with God and prevails.' The next day, the brothers meet — and embrace.",
    quote: { text: "Your name shall no longer be Jacob, but Israel.", ref: "Genesis 32:29" },
    thought: "Jacob became Israel not by winning easily, but by not letting go. Our people's name is about wrestling honestly — with life, with fear, with God — and coming out with a blessing.",
    questions: ["When did a hard moment leave you with a blessing?", "Jacob prepared for meeting Esau with gifts, prayer and readiness. How do you prepare for a difficult conversation?", "If you could choose a new name that describes who you're becoming, what would it be?"],
    kids: {
      title: "Jacob gets a new name!",
      story: "Jacob was on his way home to see his big brother Esau. They had a big fight long ago, and Jacob was scared! That night, someone came and wrestled with Jacob all night long. Jacob held on and didn't give up. In the morning, Jacob got a special new name — Israel. And the next day, Jacob and Esau hugged and made peace.",
      word: { word: "Israel", meaning: "one who struggles with God and wins", emoji: "💪" },
      questions: ["What new name did Jacob get?", "How long did Jacob wrestle?", "What did Jacob and Esau do when they met?"],
      draw: "Draw Jacob and Esau hugging."
    }
  },
  "Vayeshev": {
    summary: "Jacob loves Joseph most and gives him a special coat. Joseph dreams that his brothers will bow to him, and in jealousy they sell him as a slave and tell their father he was killed. In Egypt, Joseph rises in Potiphar's house, is falsely accused and thrown in prison, and there he interprets the dreams of Pharaoh's butler and baker.",
    quote: { text: "Here comes that dreamer!", ref: "Genesis 37:19" },
    thought: "Jealousy tore Joseph's family apart. Yet even at the bottom of a pit and in prison, Joseph's story wasn't over — God was with him.",
    questions: ["How can a family handle it when one person seems favored?", "Joseph kept his integrity even when no one was watching. Why does that matter?", "Have you ever been in a 'pit' that later led somewhere good?"],
    kids: {
      title: "Joseph's colorful coat",
      story: "Jacob gave his son Joseph a beautiful coat of many colors. Joseph had dreams that his brothers would bow down to him — and his brothers got very jealous. They threw Joseph into a pit and sold him to travelers going to Egypt. But Joseph never gave up, and God was always with him.",
      word: { word: "Kutonet Passim", meaning: "the colorful coat", emoji: "🧥" },
      questions: ["What special gift did Jacob give Joseph?", "Why were the brothers jealous?", "What can you do when you feel jealous?"],
      draw: "Draw and color Joseph's coat of many colors."
    }
  },
  "Miketz": {
    summary: "Pharaoh dreams of seven fat cows eaten by seven thin ones. Joseph, brought from prison, explains: seven years of plenty, then seven of famine. Pharaoh puts him in charge of Egypt. During the famine, Joseph's brothers come to buy food and don't recognize him; Joseph tests them, keeping Simeon and later demanding young Benjamin.",
    quote: { text: "Could we find another like him, a man in whom is the spirit of God?", ref: "Genesis 41:38" },
    thought: "Joseph gave the credit to God: 'Not I — God will answer.' Planning ahead in good years to share in hard years is a lesson for every home and every country.",
    questions: ["Joseph saved food in good years. What do you 'save' for harder times?", "Why do you think Joseph didn't reveal himself to his brothers right away?", "How do you stay humble when things go well?"],
    kids: {
      title: "Pharaoh's strange dreams",
      story: "King Pharaoh dreamed of seven fat cows and seven skinny cows. Nobody understood it except Joseph! He said: 'Seven years of lots of food are coming, then seven hungry years. Save food now!' Pharaoh made Joseph a leader, and Joseph saved enough food for everyone.",
      word: { word: "Chalom", meaning: "a dream", emoji: "🐄" },
      questions: ["What animals were in Pharaoh's dream?", "What did Joseph tell Pharaoh to do?", "What's the best dream you ever had?"],
      draw: "Draw the seven fat cows and seven skinny cows."
    }
  },
  "Vayigash": {
    summary: "Judah steps forward and offers himself as a slave in place of Benjamin. Moved, Joseph can no longer hold back and reveals himself: 'I am Joseph!' He forgives his brothers, saying God sent him ahead to save lives. Jacob, overjoyed that Joseph is alive, brings the whole family down to Egypt.",
    quote: { text: "I am Joseph. Is my father still alive?", ref: "Genesis 45:3" },
    thought: "Judah, who once sold his brother, now risks himself for his brother — that is what teshuvah looks like. And Joseph chose forgiveness over revenge.",
    questions: ["What does real change look like in a person?", "How did Joseph manage to forgive?", "Is there someone you'd like to make peace with?"],
    kids: {
      title: "\"I am Joseph!\"",
      story: "Joseph's brothers came to Egypt, but they didn't know the leader was Joseph! Then Joseph couldn't wait anymore. He cried and said: 'I am Joseph, your brother!' He hugged them and forgave them, and the whole family — even old Jacob — came to live together in Egypt.",
      word: { word: "Selicha", meaning: "forgiveness", emoji: "🤗" },
      questions: ["Did the brothers recognize Joseph at first?", "What did Joseph do when he told them who he was?", "How does it feel when someone forgives you?"],
      draw: "Draw Joseph's family together again."
    }
  },
  "Vayechi": {
    summary: "Jacob lives his last years in Egypt. He blesses Joseph's sons, Ephraim and Manasseh, and then gives each of his twelve sons a blessing. He asks to be buried in the Cave of Machpelah. After Jacob dies, the brothers fear Joseph's revenge, but Joseph comforts them: what they meant for harm, God meant for good. The book of Genesis ends.",
    quote: { text: "You intended harm to me, but God intended it for good.", ref: "Genesis 50:20" },
    thought: "To this day, parents bless their children on Friday night: 'May God make you like Ephraim and Manasseh.' A blessing is something we can give every single week.",
    questions: ["What blessing would you give each person at the table?", "Joseph saw God's hand in his hard story. Can you see it in yours?", "What do you want your family to remember about you?"],
    kids: {
      title: "Jacob blesses his family",
      story: "Old Jacob called his children and grandchildren around him. He put his hands on the heads of Joseph's sons, Ephraim and Manasseh, and blessed them. Today, many parents bless their children every Friday night with the same words!",
      word: { word: "Birkat Habanim", meaning: "the blessing of the children", emoji: "🙌" },
      questions: ["Who were Joseph's two sons?", "When do many parents bless their children today?", "What blessing would you give your family?"],
      draw: "Draw your family at the Shabbat table, giving blessings."
    }
  },

  // ---------------------------------------------------------------- Exodus
  "Shemot": {
    summary: "A new Pharaoh enslaves the Israelites and orders their baby boys thrown into the Nile. Moses is saved — hidden in a basket and raised by Pharaoh's daughter. Grown up, he flees to Midian, and at a bush that burns but isn't consumed, God sends him to free his people. Moses and Aaron ask Pharaoh to let the people go, and Pharaoh makes their work harder.",
    quote: { text: "The bush was burning with fire, but the bush was not consumed.", ref: "Exodus 3:2" },
    thought: "The story of freedom begins with brave women — the midwives Shifra and Puah, Moses' mother and sister, Pharaoh's daughter — who said no to cruelty.",
    questions: ["Who are the quiet heroes in your life?", "Moses turned aside to look at the burning bush. What makes us stop and notice?", "Moses doubted he could lead. When did you doubt yourself and do it anyway?"],
    kids: {
      title: "Baby Moses in a basket",
      story: "Pharaoh wanted to hurt the Hebrew babies, so Moses' mother hid him in a basket in the river. His sister Miriam watched over him. Pharaoh's daughter found the basket and raised Moses as her own. Years later, God spoke to Moses from a burning bush: 'Go and free My people!'",
      word: { word: "Sneh", meaning: "the burning bush", emoji: "🔥" },
      questions: ["Where was baby Moses hidden?", "Who watched over him?", "What was special about the burning bush?"],
      draw: "Draw baby Moses in his basket on the river."
    }
  },
  "Vaera": {
    summary: "God promises to bring the Israelites out of Egypt with four expressions of redemption. Moses and Aaron return to Pharaoh, and Aaron's staff becomes a serpent. Pharaoh refuses, and God brings plagues on Egypt — blood, frogs, lice, wild animals, cattle disease, boils and hail — but Pharaoh's heart remains hard.",
    quote: { text: "I will take you out… I will save you… I will redeem you… I will take you to be My people.", ref: "Exodus 6:6–7" },
    thought: "The four cups at the Seder come from these four promises. Freedom comes in stages — first out, then saved, then redeemed, then belonging.",
    questions: ["Which of the four promises speaks most to you right now?", "Why do you think Pharaoh kept saying no?", "What helps you not to 'harden your heart'?"],
    kids: {
      title: "The plagues begin",
      story: "Moses asked Pharaoh to let the people go, but Pharaoh said no! So God sent plagues: the river turned to blood, frogs hopped everywhere — even into beds and ovens! — then lice, wild animals, sick cows, boils and hail. But Pharaoh still said no.",
      word: { word: "Makot", meaning: "the plagues", emoji: "🐸" },
      questions: ["What did the river turn into?", "Where did the frogs go?", "Why do you think Pharaoh kept saying no?"],
      draw: "Draw the frogs hopping all over Egypt."
    }
  },
  "Bo": {
    summary: "The last three plagues come: locusts, darkness, and the death of the firstborn. God gives the first commandment to the people — to count the months — and the laws of the Passover offering and matzah. The Israelites put blood on their doorposts, and at midnight they finally leave Egypt in a rush, with no time for their bread to rise.",
    quote: { text: "This month shall be for you the beginning of the months.", ref: "Exodus 12:2" },
    thought: "The first mitzvah given to a free people was about time: to own our calendar and make it holy. Shabbat is that freedom every week.",
    questions: ["What does it mean to be truly free?", "Why do you think the first mitzvah was about time?", "How do you make your time holy?"],
    kids: {
      title: "Leaving Egypt!",
      story: "After ten plagues, Pharaoh finally said: 'Go!' The Israelites left Egypt so fast that their bread didn't have time to rise — it became flat matzah! They marked their doors, packed their things, and walked out to freedom together.",
      word: { word: "Matzah", meaning: "flat bread", emoji: "🫓" },
      questions: ["Why is matzah flat?", "How many plagues were there?", "What would you pack if you had to leave in a hurry?"],
      draw: "Draw the Israelites leaving Egypt with matzah."
    }
  },
  "Beshalach": {
    summary: "Pharaoh chases the Israelites to the sea. God splits the sea, the people cross on dry land, and the Egyptians are drowned. Moses and Miriam lead songs of praise. In the desert, God provides manna from heaven — a double portion on Friday, none on Shabbat — and water from a rock, and Israel fights off Amalek.",
    quote: { text: "This is my God, and I will glorify Him.", ref: "Exodus 15:2" },
    thought: "The double portion of manna on Friday is why we have two challot on the Shabbat table — a reminder that there is enough, and we can rest.",
    questions: ["Why do you think there are two challot on our table?", "Miriam danced with a tambourine. How do you celebrate good things?", "When did you need to 'take the first step' before the way opened?"],
    kids: {
      title: "The sea splits!",
      story: "Pharaoh's army chased the Israelites all the way to the sea. Nowhere to go! Then God told Moses to lift his staff — and the sea split in two, with walls of water on each side! Everyone walked across on dry land, and Miriam played her tambourine and danced.",
      word: { word: "Kriat Yam Suf", meaning: "the splitting of the sea", emoji: "🌊" },
      questions: ["What happened when Moses lifted his staff?", "What instrument did Miriam play?", "Why are there two challot on Shabbat?"],
      draw: "Draw the people walking through the split sea."
    }
  },
  "Yitro": {
    summary: "Moses' father-in-law Yitro joins the people and advises Moses to share the work of judging with others. At Mount Sinai, with thunder, lightning and the sound of the shofar, God gives the Ten Commandments to the whole people. They are invited to be 'a kingdom of priests and a holy nation.'",
    quote: { text: "I am the Lord your God, who brought you out of the land of Egypt.", ref: "Exodus 20:2" },
    thought: "The Torah was given in the open desert, to everyone together — and the portion is named after Yitro, an outsider who joined. There is room for every seeker at Sinai.",
    questions: ["Which of the Ten Commandments feels most important today?", "Yitro told Moses he couldn't do everything alone. Who helps carry your load?", "Why do you think the Torah was given to everyone at once?"],
    kids: {
      title: "The Ten Commandments",
      story: "The whole people stood around Mount Sinai. There was thunder, lightning, and a very loud shofar! Then God spoke the Ten Commandments — like 'Remember Shabbat,' 'Honor your father and mother,' and 'Don't steal.' Everyone heard it together.",
      word: { word: "Aseret HaDibrot", meaning: "the Ten Commandments", emoji: "📜" },
      questions: ["Where was the Torah given?", "What sound did the people hear?", "Can you name one of the Ten Commandments?"],
      draw: "Draw Mount Sinai with the two tablets."
    }
  },
  "Mishpatim": {
    summary: "After the Ten Commandments come many laws for daily life: fair treatment of workers and servants, responsibility for damages, caring for the stranger, the widow and the orphan, returning a lost animal even to an enemy, and the three pilgrimage festivals. The people answer, 'We will do and we will understand.'",
    quote: { text: "We will do and we will understand.", ref: "Exodus 24:7" },
    thought: "Holiness isn't only at Sinai — it's in how we pay workers, treat strangers, and return what's lost. Everyday fairness is a way of serving God.",
    questions: ["'Do not oppress the stranger, for you were strangers.' Who is the stranger today?", "Why might we 'do' before we fully 'understand'?", "Which everyday act of fairness could you do this week?"],
    kids: {
      title: "Rules for being kind",
      story: "God gave lots of rules for how to treat each other well: help someone even if you're not friends, be fair, return things people lose, and be extra kind to people who are new or alone. Living this way makes the world a better place!",
      word: { word: "Mishpat", meaning: "fairness, justice", emoji: "⚖️" },
      questions: ["What should you do if you find something someone lost?", "How can you help someone who is new?", "What's one rule your family has for being kind?"],
      draw: "Draw yourself helping someone."
    }
  },
  "Terumah": {
    summary: "God asks the people to bring gifts from the heart — gold, silver, wood, fabric and more — to build the Mishkan, a portable sanctuary. The Torah describes the Ark with its cherubim, the table for the showbread, the golden menorah, and the curtains and beams of the Mishkan.",
    quote: { text: "Let them make Me a sanctuary, that I may dwell among them.", ref: "Exodus 25:8" },
    thought: "Not 'in it' but 'among them' — God dwells among people. Every home with a Shabbat table can become a small sanctuary.",
    questions: ["What makes your home feel like a holy place?", "The gifts came from 'every heart that is willing.' What do you give with a full heart?", "If you could add one thing to make your home more sacred, what would it be?"],
    kids: {
      title: "Building God's special tent",
      story: "God asked the people to build a special tent called the Mishkan, so God could be close to them. Everyone brought gifts — gold, colorful fabric, wood and jewels. Inside was the golden Ark, a beautiful menorah, and a table with bread.",
      word: { word: "Mishkan", meaning: "the special tent for God", emoji: "⛺" },
      questions: ["What was the Mishkan?", "What did the people bring?", "What would you bring as a gift?"],
      draw: "Draw the Mishkan and the golden menorah."
    }
  },
  "Tetzaveh": {
    summary: "The people are to bring pure olive oil for a light that burns continually. The Torah describes the special clothes of the priests — Aaron's breastplate with twelve stones for the twelve tribes, the robe with bells, and the gold plate reading 'Holy to the Lord' — and the ceremony to dedicate them. Moses' name does not appear in this portion.",
    quote: { text: "To raise up an eternal light.", ref: "Exodus 27:20" },
    thought: "The ner tamid, the eternal light, still hangs in every synagogue. A small steady flame can matter more than a big fire that goes out.",
    questions: ["What 'steady light' do you keep burning in your life?", "Aaron carried the names of all the tribes on his heart. Who do you carry on your heart?", "Why do you think clothing matters in holy moments?"],
    kids: {
      title: "A light that never goes out",
      story: "God asked for pure olive oil to keep a light burning all the time — the ner tamid. The kohen gadol, Aaron, wore beautiful clothes with a breastplate of twelve shining stones — one for each tribe — and little bells on his robe.",
      word: { word: "Ner Tamid", meaning: "the light that always burns", emoji: "🪔" },
      questions: ["What was the ner tamid?", "How many stones were on Aaron's breastplate?", "Where can you see a ner tamid today?"],
      draw: "Draw Aaron's breastplate with twelve colorful stones."
    }
  },
  "Ki Tisa": {
    summary: "Moses is on Mount Sinai for forty days, and the people, afraid he won't return, build a golden calf. Moses breaks the tablets, then pleads with God to forgive the people. God reveals the Thirteen Attributes of Mercy, and Moses carves new tablets. The portion also teaches the half-shekel and the command to keep Shabbat.",
    quote: { text: "The Lord, the Lord, God, compassionate and gracious, slow to anger, abundant in kindness and truth.", ref: "Exodus 34:6" },
    thought: "After the worst failure, came second tablets and words of mercy we still pray today. In Judaism, a mistake is never the end of the story.",
    questions: ["Why do you think the people needed something they could see?", "What helps you start again after a mistake?", "Which of God's qualities — compassion, patience, kindness — do you want more of?"],
    kids: {
      title: "The golden calf",
      story: "Moses was up on the mountain for a long time, and the people got scared and impatient. They made a statue of a golden calf. Moses was so sad that he broke the tablets! But then he prayed, God forgave the people, and Moses got new tablets.",
      word: { word: "Teshuvah", meaning: "saying sorry and starting again", emoji: "🔄" },
      questions: ["Why did the people make the golden calf?", "What did Moses do with the first tablets?", "What can you do after you make a mistake?"],
      draw: "Draw Moses coming down with the new tablets."
    }
  },
  "Vayakhel": {
    summary: "Moses gathers the people and reminds them to keep Shabbat. Everyone brings gifts for the Mishkan — so much that Moses has to ask them to stop! Betzalel, filled with wisdom, leads the skilled workers, and women and men together make the Ark, the menorah, the altar and the curtains.",
    quote: { text: "Everyone whose heart lifted him up came.", ref: "Exodus 35:21" },
    thought: "The building pauses for Shabbat: even holy work stops for holy rest. And the people gave so generously they had to be told 'enough' — a rare and beautiful problem.",
    questions: ["What gift or talent do you bring to your community?", "Why do you think the Torah connects building the Mishkan and Shabbat?", "When did you give so gladly you didn't want to stop?"],
    kids: {
      title: "Everyone helps build!",
      story: "Moses asked for help building the Mishkan, and everyone brought something — jewelry, wool, wood, spices! They brought so much that Moses said: 'Stop, we have enough!' A wise artist named Betzalel led the building. And everyone rested on Shabbat.",
      word: { word: "Nedivut", meaning: "generosity", emoji: "🎁" },
      questions: ["Why did Moses say 'stop'?", "Who led the building?", "What talent can you share with others?"],
      draw: "Draw everyone bringing gifts for the Mishkan."
    }
  },
  "Pekudei": {
    summary: "Moses gives a careful accounting of all the gold, silver and copper used for the Mishkan. The priestly garments are finished, and Moses sets up the Mishkan. A cloud covers it and God's glory fills it — and from then on, the cloud leads the people on their journeys. The book of Exodus ends.",
    quote: { text: "The cloud covered the Tent of Meeting, and the glory of the Lord filled the Mishkan.", ref: "Exodus 40:34" },
    thought: "Moses accounted for every coin — honesty with what others entrust to us is itself holy. At the end of the book we say: Chazak, chazak, v'nitchazek — be strong, and let us strengthen one another.",
    questions: ["Why do you think Moses gave such a careful accounting?", "What does it mean to strengthen one another?", "Where do you feel God's 'cloud' guiding you?"],
    kids: {
      title: "The Mishkan is finished!",
      story: "At last the Mishkan was ready! Moses set it up, and a special cloud covered it — God was there. When the cloud lifted, the people traveled, and when it stayed, they stayed. God's cloud guided them through the whole desert.",
      word: { word: "Chazak!", meaning: "be strong!", emoji: "☁️" },
      questions: ["What covered the Mishkan when it was finished?", "How did the people know when to travel?", "What do we say when we finish a book of the Torah?"],
      draw: "Draw the cloud over the Mishkan."
    }
  },

  // ---------------------------------------------------------------- Leviticus
  "Vayikra": {
    summary: "God calls to Moses from the Mishkan and teaches the different kinds of offerings (korbanot): the burnt offering that rises entirely to God, the grain offering, the peace offering shared in a meal, and offerings brought to make up for mistakes — with less expensive options so that even the poor can bring one.",
    quote: { text: "When any of you brings an offering to the Lord…", ref: "Leviticus 1:2" },
    thought: "The word korban comes from karov — close. Today our prayers and acts of giving take the place of offerings; the goal is the same: to come closer.",
    questions: ["What brings you closer to God or to the people you love?", "Why do you think there were cheaper offerings for those who couldn't afford more?", "What's something you could 'offer' this week — time, kindness, attention?"],
    kids: {
      title: "Coming close to God",
      story: "Long ago, people brought gifts called korbanot to the Mishkan to feel close to God. Rich people could bring a cow, and poor people could bring a bird or some flour — every gift counted! Today, we come close to God with prayers and good deeds.",
      word: { word: "Karov", meaning: "close", emoji: "🤲" },
      questions: ["What did people bring to the Mishkan?", "Could a poor person bring a gift too?", "How do we come close to God today?"],
      draw: "Draw something you could give to make someone happy."
    }
  },
  "Tzav": {
    summary: "Aaron and his sons receive instructions for the daily work of the offerings, including keeping a fire burning on the altar at all times. Moses dedicates Aaron and his sons as priests in a seven-day ceremony, dressing them in their garments and anointing them with oil.",
    quote: { text: "A fire shall be kept burning on the altar continually; it shall not go out.", ref: "Leviticus 6:6" },
    thought: "The priests had to tend the fire every single morning. Keeping a spiritual flame alive takes small daily care, not just big moments.",
    questions: ["What small daily habit keeps your 'fire' burning?", "Why does daily routine matter in a spiritual life?", "What helps you keep going when inspiration fades?"],
    kids: {
      title: "Keep the fire burning!",
      story: "God told the kohanim, the priests, to keep a fire on the altar burning all the time — day and night, it never went out! Every morning they added wood. Aaron and his sons were dressed in special clothes to begin their holy work.",
      word: { word: "Esh Tamid", meaning: "a fire that always burns", emoji: "🔥" },
      questions: ["Did the fire on the altar ever go out?", "What did the kohanim add every morning?", "What good thing do you do every day?"],
      draw: "Draw the altar with its fire burning."
    }
  },
  "Shmini": {
    summary: "On the eighth day, the Mishkan is dedicated and fire comes down from heaven. But Aaron's sons Nadav and Avihu bring a 'strange fire' and die, and Aaron is silent in his grief. The portion then teaches which animals, fish and birds may be eaten — the laws of kashrut.",
    quote: { text: "And Aaron was silent.", ref: "Leviticus 10:3" },
    thought: "Sometimes there are no words, and silence is the most honest response. Kashrut, too, teaches that even eating can be done with awareness and holiness.",
    questions: ["When is silence wiser than words?", "Why do you think the Torah cares about what we eat?", "How can a meal become something holy?"],
    kids: {
      title: "Which animals may we eat?",
      story: "God taught which animals are kosher. Animals that chew their cud and have split hooves — like cows and sheep — are kosher. Fish need fins and scales. Pigs, camels and rabbits are not kosher. Eating kosher helps make every meal special.",
      word: { word: "Kosher", meaning: "fit to eat", emoji: "🐟" },
      questions: ["What two signs does a kosher animal have?", "What does a kosher fish need?", "What's your favorite Shabbat food?"],
      draw: "Draw a kosher fish with fins and scales."
    }
  },
  "Tazria": {
    summary: "This portion begins with the laws after childbirth and the brit milah on the eighth day. Then it describes tzara'at — a skin condition that the priest examines. A person with tzara'at stays outside the camp for a time until they are healed. The rabbis connected tzara'at with lashon hara, hurtful speech.",
    quote: { text: "He shall dwell alone; outside the camp shall be his dwelling.", ref: "Leviticus 13:46" },
    thought: "The rabbis taught that tzara'at came from lashon hara — hurtful words. Words that separate people led to a time of separation, to think about the power of what we say.",
    questions: ["Why might hurtful words be compared to an illness?", "How can we stop gossip before it starts?", "What words have healed you?"],
    kids: {
      title: "The power of words",
      story: "Our teachers say that saying mean things about people — lashon hara — can hurt like a sickness. Words are powerful! Kind words can make someone feel great, and mean words can really hurt. That's why we try to use our words to be kind.",
      word: { word: "Lashon Hara", meaning: "hurtful talk about others", emoji: "💬" },
      questions: ["What is lashon hara?", "How can words hurt?", "What kind words can you say to someone today?"],
      draw: "Draw a speech bubble with kind words inside."
    }
  },
  "Metzora": {
    summary: "The person healed of tzara'at goes through a purification ceremony with two birds, cedar wood, crimson thread and hyssop, and returns to the community. The portion also describes tzara'at that can appear on the walls of a house, and other laws of purity.",
    quote: { text: "This shall be the law of the metzora on the day of his purification.", ref: "Leviticus 14:2" },
    thought: "The priest goes out to the person outside the camp to bring them back. Healing is not only getting better — it's being welcomed home.",
    questions: ["How can we help someone who feels left out return?", "Why do you think the priest went out to the person, rather than waiting?", "What helps you start fresh?"],
    kids: {
      title: "Welcome back!",
      story: "When someone who had to stay outside the camp got better, the kohen went out to check on them. Then there was a special ceremony, and they could come back home to everyone! It's a mitzvah to help people feel welcome again.",
      word: { word: "Taharah", meaning: "becoming pure, a fresh start", emoji: "🕊️" },
      questions: ["Who went to check on the person outside the camp?", "Where did the person go after they got better?", "How can you include someone who feels left out?"],
      draw: "Draw a welcome-back party."
    }
  },
  "Achrei Mot": {
    summary: "After the death of Aaron's sons, God teaches the Yom Kippur service: the high priest enters the Holy of Holies once a year, and two goats are chosen — one offered to God, one sent away to the wilderness carrying the people's mistakes. The portion also teaches laws of holiness in family life.",
    quote: { text: "For on this day atonement shall be made for you, to cleanse you.", ref: "Leviticus 16:30" },
    thought: "Once a year, everything is cleaned and we begin again. But we don't need to wait for Yom Kippur — every Shabbat is a small chance to set down what weighs on us.",
    questions: ["What would you like to 'send away' this week?", "Why do you think we need a day of starting fresh?", "How do you make peace with yourself after a hard week?"],
    kids: {
      title: "A day to start fresh",
      story: "God taught Aaron about a very special day — Yom Kippur. Once a year, the kohen gadol went into the holiest room and asked God to forgive everyone. It's a day to say sorry and start fresh, like a clean, new page.",
      word: { word: "Kapparah", meaning: "being forgiven", emoji: "📄" },
      questions: ["What special day does this portion talk about?", "Who went into the holiest room?", "Who could you say sorry to?"],
      draw: "Draw a clean new page with something good you'll do."
    }
  },
  "Kedoshim": {
    summary: "God tells the whole people: 'You shall be holy, for I am holy.' Holiness is spelled out in everyday life: respect your parents, keep Shabbat, leave the corners of your field for the poor, pay workers on time, don't put a stumbling block before the blind, judge fairly, don't take revenge or hold a grudge — and love your neighbor as yourself.",
    quote: { text: "Love your neighbor as yourself.", ref: "Leviticus 19:18" },
    thought: "Holiness here isn't about being far from the world — it's about how we treat neighbors, workers and strangers. Rabbi Akiva called 'love your neighbor' a great principle of the Torah.",
    questions: ["What does it mean to love your neighbor 'as yourself'?", "Which everyday act from this portion could you try this week?", "How is holiness different from just being nice?"],
    kids: {
      title: "Love your neighbor",
      story: "God said: 'Be holy!' How? By being kind every day: respect your parents, share with people who need help, don't trick anyone, and love your neighbor like you love yourself. Being holy means being good to others!",
      word: { word: "Kedushah", meaning: "holiness", emoji: "❤️" },
      questions: ["How can we be holy?", "What does 'love your neighbor as yourself' mean?", "How can you be a good neighbor this week?"],
      draw: "Draw you and a friend helping each other."
    }
  },
  "Emor": {
    summary: "Special rules for the priests are taught. Then the Torah lists the holy times of the year: Shabbat, Pesach, the counting of the Omer, Shavuot, Rosh Hashanah, Yom Kippur and Sukkot. The portion ends with the lamp of the Mishkan and the showbread.",
    quote: { text: "These are the appointed seasons of the Lord, holy gatherings.", ref: "Leviticus 23:4" },
    thought: "The Jewish calendar is a journey through the year — from freedom on Pesach to Torah on Shavuot to joy on Sukkot. Each holiday is a meeting with God, and Shabbat comes first on the list.",
    questions: ["Which Jewish holiday is your favorite, and why?", "Why do you think Shabbat is listed before all the holidays?", "How do holidays help us remember who we are?"],
    kids: {
      title: "The holidays of the year",
      story: "God gave us special days to celebrate! Shabbat every week, Pesach with matzah, Shavuot when we got the Torah, Rosh Hashanah with the shofar, Yom Kippur, and Sukkot when we sit in a sukkah. Every holiday is like a party with God!",
      word: { word: "Moadim", meaning: "the holidays", emoji: "🎉" },
      questions: ["Which holiday comes every single week?", "What do we eat on Pesach?", "What's your favorite holiday?"],
      draw: "Draw your favorite holiday."
    }
  },
  "Behar": {
    summary: "On Mount Sinai, God teaches the Shemitah: every seventh year the land rests and is not farmed. Every fiftieth year is the Jubilee, when land returns to its original families and servants go free. The portion teaches care for people who fall on hard times — lending without interest and helping them get back on their feet.",
    quote: { text: "Proclaim liberty throughout the land to all its inhabitants.", ref: "Leviticus 25:10" },
    thought: "Even the land gets a Shabbat. These words are engraved on America's Liberty Bell — the idea that freedom and rest belong to everyone.",
    questions: ["Why do you think even the land needs rest?", "How can we help someone back on their feet without embarrassing them?", "What would a 'Shabbat year' look like in your life?"],
    kids: {
      title: "Even the land rests!",
      story: "God said: every seventh year, the farmers should let the fields rest — no planting! It's like Shabbat for the land. And every fiftieth year, called Yovel, everyone who had to work for others went free, and families got their land back.",
      word: { word: "Shemitah", meaning: "the land's rest year", emoji: "🌱" },
      questions: ["Every how many years does the land rest?", "What happened in the fiftieth year?", "Why is it good to rest?"],
      draw: "Draw a field resting in the sunshine."
    }
  },
  "Bechukotai": {
    summary: "God promises blessings if the people follow the commandments — rain in its season, peace in the land, and God walking among them — and warns of hardships if they abandon them. Yet God promises never to break the covenant. The book of Leviticus ends with laws of vows and gifts to the Mishkan.",
    quote: { text: "I will walk among you, and I will be your God.", ref: "Leviticus 26:12" },
    thought: "Even after the hardest warnings, the Torah promises: God will remember the covenant. The relationship is never fully broken.",
    questions: ["What does it mean to 'walk' with God?", "What blessings in your life are easy to forget?", "How do you keep a promise when it gets hard?"],
    kids: {
      title: "God's promise",
      story: "God promised: if we follow the Torah, there will be rain at the right time, lots of food, and peace. And God said: 'I will walk among you!' Even when things are hard, God never forgets the special promise with the Jewish people.",
      word: { word: "Brit", meaning: "a promise, a covenant", emoji: "🤝" },
      questions: ["What did God promise?", "Does God forget the promise?", "What's a promise you made and kept?"],
      draw: "Draw rain falling on a garden."
    }
  },

  // ---------------------------------------------------------------- Numbers
  "Bamidbar": {
    summary: "In the wilderness of Sinai, Moses counts the Israelites tribe by tribe. Each tribe camps in its place around the Mishkan, under its own flag, and the Levites are given the job of caring for the Mishkan and carrying it on the journey.",
    quote: { text: "Take a count of the whole community… by the number of names.", ref: "Numbers 1:2" },
    thought: "God counted the people 'by name' — not as a crowd, but one by one. Every person counts, and every tribe had its own place around the center.",
    questions: ["What makes you feel counted — like you really matter?", "Each tribe had its own flag. What would be on your family's flag?", "Why do you think the Torah was given in a desert, a place that belongs to no one?"],
    kids: {
      title: "Everyone counts!",
      story: "In the desert, God told Moses to count all the people — one by one, by name! Each of the twelve tribes camped around the Mishkan with its own colorful flag. Everyone had a special place.",
      word: { word: "Midbar", meaning: "the desert", emoji: "🏜️" },
      questions: ["Where were the Israelites?", "How many tribes were there?", "What would you put on your own flag?"],
      draw: "Design your family's flag."
    }
  },
  "Nasso": {
    summary: "The Levite families receive their jobs. The Torah teaches about the nazir, who vows not to drink wine or cut their hair for a time, and gives the Priestly Blessing. At the Mishkan's dedication, each of the twelve tribal leaders brings an identical gift on his own day.",
    quote: { text: "May the Lord bless you and keep you.", ref: "Numbers 6:24" },
    thought: "Twelve leaders brought exactly the same gift, yet the Torah lists each one in full — because each gift came from a different heart. And many parents give the Priestly Blessing to their children every Friday night.",
    questions: ["Why do you think the Torah repeats the same gift twelve times?", "What blessing would you give someone tonight?", "How can the same act mean something different to different people?"],
    kids: {
      title: "The Priestly Blessing",
      story: "God gave the kohanim beautiful words to bless the people: 'May God bless you and keep you. May God shine on you. May God give you peace.' Many parents say these same words to their children every Friday night!",
      word: { word: "Birkat Kohanim", meaning: "the Priestly Blessing", emoji: "✋" },
      questions: ["Who gave the blessing to the people?", "When do many parents say it to their children?", "What does 'shalom' mean?"],
      draw: "Draw hands giving a blessing."
    }
  },
  "Beha’alotcha": {
    summary: "Aaron lights the menorah, and the people set out from Sinai following the cloud. The people complain about the manna and long for the food of Egypt. Moses, overwhelmed, receives seventy elders to help him. Miriam speaks against Moses and is struck with tzara'at; Moses prays for her: 'Please, God, heal her!'",
    quote: { text: "When you light the lamps…", ref: "Numbers 8:2" },
    thought: "Moses' prayer for Miriam is only five Hebrew words — El na refa na lah. Sometimes the shortest prayers are the most powerful.",
    questions: ["Why do people sometimes miss even hard times from the past?", "Moses needed help leading. When do you ask for help?", "Who would you say a short prayer for right now?"],
    kids: {
      title: "Lighting the menorah",
      story: "Aaron lit the golden menorah in the Mishkan, and its light shone brightly. Then the people began to travel, following God's cloud. When Miriam got sick, Moses said a short prayer: 'Please, God, heal her!' — and she got better.",
      word: { word: "Menorah", meaning: "the lamp", emoji: "🕎" },
      questions: ["Who lit the menorah?", "What did the people follow when they traveled?", "What short prayer did Moses say?"],
      draw: "Draw Aaron lighting the menorah."
    }
  },
  "Sh’lach": {
    summary: "Moses sends twelve spies to scout the Land of Israel. They return with giant grapes, but ten say the people there are too strong. Only Caleb and Joshua say, 'We can do it!' The people lose heart, and they must wander forty years in the desert. The portion ends with the mitzvah of tzitzit.",
    quote: { text: "We should go up at once and possess it, for we are well able to do it.", ref: "Numbers 13:30" },
    thought: "All twelve saw the same land. Ten saw giants; two saw a gift. How we look at things can change where we end up.",
    questions: ["When did fear make something look bigger than it was?", "What helped Caleb and Joshua see differently?", "The tzitzit remind us of the mitzvot. What reminds you of what matters?"],
    kids: {
      title: "The twelve spies",
      story: "Moses sent twelve spies to see the Land of Israel. They brought back grapes so big that two people had to carry them! Ten spies said: 'We're too small!' But Caleb and Joshua said: 'With God's help, we can do it!'",
      word: { word: "Emunah", meaning: "trust, faith", emoji: "🍇" },
      questions: ["How many spies went?", "What did they bring back?", "Which two spies were brave?"],
      draw: "Draw two spies carrying a giant bunch of grapes."
    }
  },
  "Korach": {
    summary: "Korach, a Levite, gathers followers and challenges Moses and Aaron's leadership, claiming everyone is equally holy. The earth opens and swallows the rebels. To show who God chose, each tribe leader places a staff in the Mishkan, and Aaron's staff blossoms and grows almonds.",
    quote: { text: "All the congregation are holy, every one of them.", ref: "Numbers 16:3" },
    thought: "Korach's words sound noble, but his aim was power for himself. Pirkei Avot calls his quarrel 'not for the sake of heaven.' A good disagreement seeks the truth, not victory.",
    questions: ["What makes an argument 'for the sake of heaven'?", "How can you tell when someone wants power rather than what's right?", "How do you disagree respectfully at home?"],
    kids: {
      title: "The blossoming staff",
      story: "Korach wanted to be the leader instead of Moses and Aaron, and he caused a big fight. To show who God chose, each tribe put a stick in the Mishkan overnight. In the morning, Aaron's stick had flowers and almonds growing on it!",
      word: { word: "Machloket", meaning: "an argument", emoji: "🌸" },
      questions: ["Who wanted to be the leader?", "What grew on Aaron's stick?", "How can you disagree with someone nicely?"],
      draw: "Draw Aaron's staff with flowers and almonds."
    }
  },
  "Chukat": {
    summary: "The Torah teaches the mysterious law of the red heifer. Miriam dies, and the well that followed her dries up. The people complain of thirst; God tells Moses to speak to the rock, but Moses strikes it, and he learns he will not enter the land. Aaron dies, and the people grieve him for thirty days.",
    quote: { text: "Speak to the rock before their eyes, and it will give its water.", ref: "Numbers 20:8" },
    thought: "Tradition says a well followed the people in Miriam's merit. When a beloved person is gone, we often discover how much they quietly gave us.",
    questions: ["Who quietly gives you 'water' — strength and care?", "Why do you think speaking mattered more than striking?", "How do you handle frustration with people you love?"],
    kids: {
      title: "Water from a rock",
      story: "The people were thirsty in the desert. God told Moses: 'Speak to the rock, and water will come out.' But Moses was upset and hit the rock instead. Water came gushing out for everyone — but God wanted Moses to use words, not a stick.",
      word: { word: "Mayim", meaning: "water", emoji: "💧" },
      questions: ["What did God tell Moses to do to the rock?", "What did Moses do instead?", "Why is it better to use words when we're upset?"],
      draw: "Draw water gushing out of the rock."
    }
  },
  "Balak": {
    summary: "King Balak of Moab hires the prophet Balaam to curse Israel. On the way, Balaam's donkey sees an angel blocking the road and speaks! Balaam tries three times to curse Israel, but each time blessings come out instead — including 'How goodly are your tents, O Jacob.'",
    quote: { text: "How goodly are your tents, O Jacob, your dwellings, O Israel!", ref: "Numbers 24:5" },
    thought: "Words meant to curse became one of our most beloved prayers, Mah Tovu, said on entering the synagogue. And sometimes even a donkey sees what a prophet misses.",
    questions: ["What makes a home a 'goodly tent'?", "When did something meant for harm turn into a blessing?", "What might we be missing that someone 'simpler' sees clearly?"],
    kids: {
      title: "The talking donkey",
      story: "King Balak wanted Balaam to say bad things about the Israelites. On the way, Balaam's donkey saw an angel and stopped — and then the donkey talked! When Balaam tried to curse the Israelites, only beautiful blessings came out: 'How good are your tents, Israel!'",
      word: { word: "Mah Tovu", meaning: "how good!", emoji: "🫏" },
      questions: ["What did the donkey see?", "What surprising thing did the donkey do?", "What came out when Balaam tried to curse?"],
      draw: "Draw Balaam's talking donkey."
    }
  },
  "Pinchas": {
    summary: "Pinchas is rewarded with a covenant of peace. A new census is taken before entering the land. The five daughters of Tzelofchad ask for their father's inheritance, and God says they are right. Joshua is chosen to lead after Moses, and the portion lists the offerings for every holiday of the year.",
    quote: { text: "Give us a portion among our father's brothers.", ref: "Numbers 27:4" },
    thought: "Five sisters stood up and asked respectfully for what was fair — and the law was changed. Asking a good question can make the Torah's justice shine.",
    questions: ["When is it right to ask for a rule to change?", "What made the daughters of Tzelofchad's request so strong?", "What qualities do you look for in a leader like Joshua?"],
    kids: {
      title: "Five brave sisters",
      story: "Five sisters — Machlah, Noa, Choglah, Milkah and Tirtzah — had no brothers. They asked Moses: 'Can we have our father's land?' Moses asked God, and God said: 'They are right!' And Joshua was chosen as the next leader.",
      word: { word: "Tzedek", meaning: "fairness", emoji: "👭" },
      questions: ["How many sisters were there?", "What did they ask for?", "What did God say?"],
      draw: "Draw the five sisters standing together."
    }
  },
  "Matot": {
    summary: "Moses teaches the importance of keeping vows and promises. The Israelites fight the Midianites. The tribes of Reuben and Gad ask to settle east of the Jordan, where the land is good for their flocks; Moses agrees, as long as they first help their brothers conquer the land.",
    quote: { text: "He shall not break his word; he shall do all that comes out of his mouth.", ref: "Numbers 30:3" },
    thought: "Our words create obligations. And Reuben and Gad could settle only after they promised to stand with everyone else — no tribe is alone.",
    questions: ["Why do words matter so much in Judaism?", "When is it hard to keep a promise?", "How can we stand with others even when we're already 'settled'?"],
    kids: {
      title: "Keeping your word",
      story: "Moses taught: when you make a promise, keep it! Two tribes, Reuben and Gad, had lots of sheep and wanted to stay on the other side of the river where there was green grass. Moses said yes — if they promised to help everyone else first. And they kept their promise!",
      word: { word: "Neder", meaning: "a promise", emoji: "🐑" },
      questions: ["What does Moses teach about promises?", "Why did Reuben and Gad want that land?", "What did they promise to do first?"],
      draw: "Draw sheep in green fields by the river."
    }
  },
  "Masei": {
    summary: "The Torah lists all forty-two stops of the Israelites' journey from Egypt to the edge of the Promised Land. The borders of the land are described, cities are given to the Levites, and six cities of refuge are set aside. The book of Numbers ends.",
    quote: { text: "These are the journeys of the Children of Israel.", ref: "Numbers 33:1" },
    thought: "Every stop is remembered — even the hard ones. Our own journeys, with all their detours, are part of who we become.",
    questions: ["What 'stops' in your life shaped you most?", "Why do you think the Torah lists every single stop?", "Where do you think your journey is heading?"],
    kids: {
      title: "The long journey",
      story: "The Torah remembers every place the Israelites camped on their long trip through the desert — forty-two stops! Some were easy and some were hard, but each one was part of the adventure. Now they were almost in the Land of Israel!",
      word: { word: "Masa", meaning: "a journey", emoji: "🗺️" },
      questions: ["How many stops were on the journey?", "Where were they going?", "What's the best trip you ever went on?"],
      draw: "Draw a map of a journey with lots of stops."
    }
  },

  // ---------------------------------------------------------------- Deuteronomy
  "Devarim": {
    summary: "In the last weeks of his life, Moses begins his farewell speeches to the people on the plains of Moab. He reviews their forty years in the desert — appointing judges, the story of the spies, and the battles on the way — reminding them of what they've lived through together.",
    quote: { text: "These are the words that Moses spoke to all Israel.", ref: "Deuteronomy 1:1" },
    thought: "Moses once said 'I am not a man of words' — and now he gives a whole book of them. People grow into what they once thought they couldn't do.",
    questions: ["What have you grown into that once seemed impossible?", "Why do you think Moses retold the story of the journey?", "What lessons from your past would you share with the next generation?"],
    kids: {
      title: "Moses remembers",
      story: "Moses was getting old, and he gathered all the people to remember their long journey together: leaving Egypt, getting the Torah, traveling through the desert. Moses, who once said he wasn't good at speaking, now gave the most beautiful speeches!",
      word: { word: "Devarim", meaning: "words", emoji: "🗣️" },
      questions: ["Who gave the big speeches?", "What did Moses remind the people about?", "What's a favorite memory from your family?"],
      draw: "Draw a favorite family memory."
    }
  },
  "Vaetchanan": {
    summary: "Moses pleads to enter the land, and God says no. He repeats the Ten Commandments and teaches the Shema: 'Hear, O Israel, the Lord is our God, the Lord is One,' with the command to love God with all your heart, soul and might, to teach these words to your children, and to write them on your doorposts.",
    quote: { text: "Hear, O Israel: the Lord is our God, the Lord is One.", ref: "Deuteronomy 6:4" },
    thought: "The Shema — said morning, night and at bedtime — first appears here. Love of God is meant to fill the heart, the home, the doorpost and the conversation with our children.",
    questions: ["What does it mean to love God 'with all your heart'?", "How do you pass on what matters most to the next generation?", "Moses' prayer wasn't answered the way he wanted. How do you handle a 'no'?"],
    kids: {
      title: "Shema Yisrael",
      story: "Moses taught the most famous words in the Torah: 'Shema Yisrael — Hear, O Israel, God is One!' We say the Shema in the morning, at night, and at bedtime. And we write it in the mezuzah on our doors!",
      word: { word: "Shema", meaning: "hear, listen", emoji: "👂" },
      questions: ["What does 'Shema' mean?", "When do we say the Shema?", "Where else is the Shema written?"],
      draw: "Draw a mezuzah on your door."
    }
  },
  "Eikev": {
    summary: "Moses promises blessings for keeping the mitzvot and reminds the people of the manna and how God cared for them in the desert. He warns them not to forget God when they become comfortable, and he teaches the mitzvah of blessing God after eating. The second paragraph of the Shema appears here.",
    quote: { text: "You shall eat and be satisfied, and bless the Lord your God.", ref: "Deuteronomy 8:10" },
    thought: "The mitzvah to bless after meals comes from this verse — Birkat HaMazon. It's easy to pray when we're hungry; the Torah asks us to remember to thank when we're full.",
    questions: ["Why is it harder to say thank you when things are good?", "What are you grateful for at this meal?", "How do you stay humble when life is comfortable?"],
    kids: {
      title: "Saying thank you after eating",
      story: "Moses taught: 'When you eat and you're full, say thank you to God!' That's why we say a blessing after meals, called Birkat HaMazon. Moses also reminded everyone how God gave them manna from the sky in the desert.",
      word: { word: "Hakarat HaTov", meaning: "saying thank you", emoji: "🙏" },
      questions: ["When do we say Birkat HaMazon?", "What food fell from the sky in the desert?", "What are you thankful for today?"],
      draw: "Draw your favorite meal and a big thank-you."
    }
  },
  "Re’eh": {
    summary: "Moses sets before the people a blessing and a curse — the choice is theirs. He teaches about the place God will choose for worship, the laws of kashrut, giving tithes, the Shemitah release of debts, opening your hand to the poor, and the three pilgrimage festivals when everyone rejoices together.",
    quote: { text: "See, I set before you today a blessing and a curse.", ref: "Deuteronomy 11:26" },
    thought: "'You shall surely open your hand' to the poor — and rejoice on the holidays with the stranger, the orphan and the widow. Joy in Judaism is meant to be shared.",
    questions: ["What choices this week were really choices between blessing and its opposite?", "Who could you include in your celebration?", "Why do you think the Torah commands us to be happy on holidays?"],
    kids: {
      title: "Choose the good!",
      story: "Moses told the people: 'Look! You can choose a blessing!' Every day we can choose to be kind, to share, and to do mitzvot. Moses also said to open your hand and help people who need it, and to make sure everyone is happy on the holidays.",
      word: { word: "Bechirah", meaning: "choice", emoji: "✋" },
      questions: ["What did Moses say we can choose?", "How can we help people who need it?", "What good choice did you make today?"],
      draw: "Draw an open hand sharing with others."
    }
  },
  "Shoftim": {
    summary: "The people must appoint fair judges and officers in every city — 'Justice, justice you shall pursue.' The Torah sets rules for kings, priests and prophets, cities of refuge, honest witnesses, and even for war: don't cut down fruit trees during a siege.",
    quote: { text: "Justice, justice you shall pursue.", ref: "Deuteronomy 16:20" },
    thought: "Why 'justice' twice? Our teachers said: pursue justice with just means. And even in war the Torah protects fruit trees — caring for creation is part of justice.",
    questions: ["What does it mean to 'pursue' justice, not just wait for it?", "Why do you think the Torah protects fruit trees?", "Where can you bring more fairness into your world?"],
    kids: {
      title: "Being fair",
      story: "God said every town needs fair judges who don't take sides or take presents to change their minds. 'Tzedek, tzedek tirdof — Justice, justice, run after it!' The Torah even says to protect fruit trees, because they help everyone.",
      word: { word: "Shofet", meaning: "a judge", emoji: "🌳" },
      questions: ["What must a good judge be?", "Which trees does the Torah protect?", "How can you be fair when you play with friends?"],
      draw: "Draw a fruit tree full of fruit."
    }
  },
  "Ki Teitzei": {
    summary: "This portion has more mitzvot than any other — seventy-four. They include returning lost objects, helping a fallen animal, building a fence on your roof for safety, sending away the mother bird before taking the eggs, paying workers on time, fair weights and measures, and remembering Amalek.",
    quote: { text: "You may not hide yourself.", ref: "Deuteronomy 22:3" },
    thought: "Seeing a lost object or a fallen animal and looking away is not allowed: 'You may not hide yourself.' Holiness is noticing and stepping in.",
    questions: ["When is it tempting to 'look away'?", "Which of these everyday mitzvot surprises you?", "How can we make our homes and roads safer for others?"],
    kids: {
      title: "Lots of mitzvot!",
      story: "This portion has the most mitzvot in the whole Torah! If you find something someone lost — return it. If an animal falls — help it up. Build a fence on your roof so no one falls. And be gentle with a mother bird. Every mitzvah is a way to care!",
      word: { word: "Hashavat Aveidah", meaning: "returning a lost thing", emoji: "🐦" },
      questions: ["What should you do if you find something lost?", "Why build a fence on the roof?", "What mitzvah can you do this week?"],
      draw: "Draw yourself returning something someone lost."
    }
  },
  "Ki Tavo": {
    summary: "When the people enter the land, they are to bring their first fruits to the Temple and tell the story of their ancestors with thanks. They are to write the Torah on stones and hear blessings and curses at two mountains. Moses reminds them that God gave them 'a heart to know, eyes to see and ears to hear.'",
    quote: { text: "You shall rejoice in all the good that the Lord your God has given you.", ref: "Deuteronomy 26:11" },
    thought: "The farmer brought the very first fruit — not the leftovers — with a story of thanks. Gratitude begins with noticing the first good things before we take them for granted.",
    questions: ["What 'first fruits' — first good things — are you grateful for?", "Why do you think the farmer had to tell the family story?", "What does it take to have 'eyes to see' the good?"],
    kids: {
      title: "The first fruits",
      story: "When the farmers' fruit started to grow in the Land of Israel, they took the very first, best fruits in a basket to the Temple to say thank you to God. There was music and parades! It was a big thank-you party.",
      word: { word: "Bikkurim", meaning: "the first fruits", emoji: "🧺" },
      questions: ["What did the farmers bring?", "Where did they bring them?", "What would you put in your thank-you basket?"],
      draw: "Draw a basket of the seven special fruits."
    }
  },
  "Nitzavim": {
    summary: "On his last day, Moses gathers everyone — leaders, children, workers, strangers — to enter the covenant, including those 'not here today,' all future generations. He says the Torah is not far away, not in heaven or across the sea, but very near, in your mouth and your heart. 'Choose life!'",
    quote: { text: "I have set before you life and death, blessing and curse — choose life.", ref: "Deuteronomy 30:19" },
    thought: "'It is not in heaven' — the Torah is close enough to live. And the covenant includes those 'not here today': every Jew in every generation, every convert who would one day join, was there.",
    questions: ["What does 'choose life' mean in your everyday choices?", "Why is it important that the Torah is 'not in heaven'?", "How does it feel to know you were included at that gathering?"],
    kids: {
      title: "Everyone is here!",
      story: "Moses gathered everyone — grown-ups, kids, people who chopped wood and carried water, and even people who weren't born yet! He said: 'The Torah isn't far away. It's close to you, in your mouth and in your heart. Choose life!'",
      word: { word: "Ubacharta Bachayim", meaning: "choose life", emoji: "🌻" },
      questions: ["Who was standing with Moses?", "Where is the Torah, according to Moses?", "How can you choose good things?"],
      draw: "Draw everyone standing together, including you!"
    }
  },
  "Vayeilech": {
    summary: "Moses, now 120 years old, tells the people he will not cross the Jordan. He encourages Joshua before everyone: 'Be strong and courageous.' Moses writes the Torah and commands that it be read to the whole people every seven years — men, women, children and strangers.",
    quote: { text: "Be strong and of good courage; do not fear.", ref: "Deuteronomy 31:6" },
    thought: "Moses passed the leadership on with a blessing, not with fear. And the Torah was to be read to everyone together — learning belongs to the whole community.",
    questions: ["What helps you be strong when things change?", "How do you pass something on gracefully?", "Why should children and strangers hear the Torah too?"],
    kids: {
      title: "Be strong!",
      story: "Moses was 120 years old. He called Joshua, the new leader, and said in front of everyone: 'Be strong and brave! God will be with you.' Then Moses wrote down the Torah so everyone could read it — big people and little people too!",
      word: { word: "Chazak Ve'ematz", meaning: "be strong and brave", emoji: "🦁" },
      questions: ["How old was Moses?", "Who was the new leader?", "When do you need to be brave?"],
      draw: "Draw Moses giving Joshua a blessing."
    }
  },
  "Ha’azinu": {
    summary: "Moses teaches the people a song, calling heaven and earth as witnesses. It tells of God's faithful care — 'like an eagle stirring up its nest' — and of the people's forgetting and returning. Afterwards, God tells Moses to climb Mount Nebo to see the land he will not enter.",
    quote: { text: "Give ear, O heavens, and I will speak; let the earth hear the words of my mouth.", ref: "Deuteronomy 32:1" },
    thought: "Moses' last teaching is a song. Melodies stay with us long after lectures fade — maybe that's why we sing at the Shabbat table.",
    questions: ["What song or melody connects you to your Judaism?", "God is compared to an eagle teaching its young to fly. Who taught you to 'fly'?", "Why do you think Moses chose a song?"],
    kids: {
      title: "Moses' song",
      story: "Before saying goodbye, Moses taught the people a beautiful song about how God takes care of us, like a mother eagle who carries her babies on her wings and teaches them to fly. Then God showed Moses the Land of Israel from a mountaintop.",
      word: { word: "Shirah", meaning: "a song", emoji: "🦅" },
      questions: ["What did Moses teach the people before saying goodbye?", "What bird is God compared to?", "What's your favorite Shabbat song?"],
      draw: "Draw a mother eagle teaching her babies to fly."
    }
  },
  "Vezot Haberakhah": {
    summary: "Moses blesses each tribe before he dies. He climbs Mount Nebo, sees the whole land, and dies there; God buries him, and no one knows his burial place. The Torah ends: there was never again a prophet like Moses, whom God knew face to face. We read this on Simchat Torah — and start again from the beginning.",
    quote: { text: "Moses commanded us the Torah, the inheritance of the congregation of Jacob.", ref: "Deuteronomy 33:4" },
    thought: "The Torah ends and immediately begins again — Bereshit. Learning is never finished; every year we find something new in the same words.",
    questions: ["What did you learn from the Torah this year?", "Why do you think we start again right away?", "What 'inheritance' would you like to pass on?"],
    kids: {
      title: "The Torah ends — and starts again!",
      story: "Moses gave a special blessing to each tribe. Then God showed him the whole Land of Israel. This is the very end of the Torah! On Simchat Torah we dance with the Torah, finish it, and start reading it again from the very beginning.",
      word: { word: "Simchat Torah", meaning: "joy of the Torah", emoji: "💃" },
      questions: ["What did Moses give each tribe?", "What happens on Simchat Torah?", "What's your favorite Torah story?"],
      draw: "Draw people dancing with the Torah."
    }
  }
};

/** Loose key: letters only, lower case ("Beha’alotcha" → "behaalotcha"). */
function parshaKey(name) {
  return String(name || "").toLowerCase().replace(/[^a-z]/g, "");
}

const PARSHA_INDEX = (() => {
  const map = {};
  Object.keys(PARSHA_CONTENT).forEach(k => { map[parshaKey(k)] = PARSHA_CONTENT[k]; });
  return map;
})();

/**
 * The content for a portion as Hebcal names it ("Vayishlach", "Matot-Masei"…), or
 * null. For a double portion it returns { parts: [first, second], ...first } so the
 * sheet can show both summaries and the first one's table and kids content.
 */
function parshaContent(name) {
  const clean = String(name || "").replace(/^Parashat\s+/, "");
  const whole = PARSHA_INDEX[parshaKey(clean)];
  if (whole) return whole;
  const parts = clean.split("-").map(p => PARSHA_INDEX[parshaKey(p)]).filter(Boolean);
  if (!parts.length) return null;
  return Object.assign({}, parts[0], { parts });
}
