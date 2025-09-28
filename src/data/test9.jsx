const test9 = {
  parts: [
    {
      title: 'PASSAGE 1',
      passage: `Why good ideas fail

As part of a marketing course, two marketing experts comment on a hypothetical case study involving TF, a fictional retail giant specializing home furnishing. The experts give concrete solutions and advice to assist students

Hypothetical case study:
TF became a retail success in the 1970s when it succeeded in spotting homeware trends and meeting the needs of its then trendy young customers. However, by 2004, the TF stores were failing and a rethink was clearly necessary. Tibal Fisher, TF's founder and CEO, decided to change its focus under the new brand name of TF's NextStage. His aim was to recapture the now ageing customers that had given him his early success and target consumers aged 60+ with devices and gadgets specifically designed to assist them with the problems associated with ageing: mobile phones with screens that were easy to read; kitchen gadgets with comfortable grips; electronic devices that were easy to set and adjust. TF's market research proved to be very positive, showing strong consumer support for the products.

In 2007, the stores were remodelled at a cost of US$40 million and the new brand was launched. Each store was made more comfortable and featured a coffee shop to help increase traffic – Tibal had predicted that if they could get customers into the stores then the products would sell themselves. However, by 2009 it was clear that the idea was a failure and the stores consistently remained empty. Customers complained that the new stores felt like a senior center and reminded them that they were growing old.

Feedback from experts:

Expert 1: Donna Sturgess, global head of innovation, GlaxoSmithKline
The TF team's customer research efforts are a classic case of missing the subconscious associations at work in consumers' minds. Tibal and his executives looked only at surface attitudes. Since those attitudes make up a relatively small part of the total consumer response, the executives are clueless about the reason for the poor sales. It's critical for companies to understand that every customer relates to a brand emotionally, and it's those emotions that trigger - or block – purchases.

That's why we've focused on using emotional strategies behind branding for a number of years now. A great example is Alli (pronounced 'ally'), a drug to aid weight loss. The product deals with a highly emotional issue, so in marketing it, we faced the same challenge that the new TF stores are facing: the very thought of buying the product reminds customers that they have problems they feel negatively about. In the case of TF's NextStage, the problems are age and infirmity. In the case of Alli, the problems are excessive weight and all its consequences. There's always a risk that consumers' negative feelings will discourage them from starting or staying on a diet. So, after extensive market research, we took a number of steps to inject positive emotions into the whole process of using the product.

First we came up with a name that sounds like a helpful partner. We also aimed to make the container both beautiful and functional - something that didn't just hold pills but could later be used to store diet guides and recipes. Traditional market research is unlikely to uncover ideas like this, so we use a wide variety of techniques. Even simple techniques such as one-on-one interviews, or ethnographical observation that involves going into people's houses to examine their behavior, can provide valuable data.

Expert 2: Alex Lee, president of OXO International, maker of OXO Good Grips household products
This retailer can get back on track by remembering a principle that applies to consumers or general and those aged 60+ in particular: they're attracted by brands they associate with the type of people they'd like to be - not the type they really are. That's why marketing campaigns for surf gear feature surfers, not the city dwellers who will wear the products while doing their shopping.

I was reminded of this principle a few years ago when we wanted to find out how far we could apply our design philosophy making things easier to use in order to move from our core business, kitchen tools, into other products. We conducted what are known as focus groups, where participants were asked to look at photos of people and pick those they perceived to be users and nonusers of our products. Consistently they picked people who looked fit as the sort who would use our products, and people who looked old and boring as the sort who wouldn't. Yet the participants, all owners of our products, looked a lot more like the latter than the former.

Although the needs of elderly users and those with deteriorating vision or dexterity are very much taken into consideration when we develop new designs, we try to offer products that appeal to 20- and 30-year-olds. We believe that referring to these products as helping tools would serve only to harm the brand in our customers' eyes. That's why our philosophy of universal design, which Involves creating products that are comfortably useable by the largest possible range of people, is never explicitly stated as part of our marketing position.

We've found that market research doesn't need to be very sophisticated. For instance, we have conducted simple surveys in the lobby of our building offering free products. In exchange for people's opinions. Some may call this unscientific but we have uncovered great insights this way. Sometimes the most important signals come from an executive's own instincts. In Tibal Fisher's case, this could have told him what his surveys and focus groups didn't: 60-plus-year-olds won't support a business that expects them to act their age.`,

      questions: [
        // TRUE / FALSE / NOT GIVEN
        {
          id: 1,
          type: 'mcq',
          question: 'The TF NextStage stores planned to sell products to make life easier for older people.',
          options: ['TRUE', 'FALSE', 'NOT GIVEN']
        },
        {
          id: 2,
          type: 'mcq',
          question: 'TF\'s market research indicated that people liked the products.',
          options: ['TRUE', 'FALSE', 'NOT GIVEN']
        },
        {
          id: 3,
          type: 'mcq',
          question: 'It cost more than expected to remodel the TF stores.',
          options: ['TRUE', 'FALSE', 'NOT GIVEN']
        },
        {
          id: 4,
          type: 'mcq',
          question: 'The TF NextStage coffee shops sold their own brand of food and drink.',
          options: ['TRUE', 'FALSE', 'NOT GIVEN']
        },
        {
          id: 5,
          type: 'mcq',
          question: 'TF NextStage customers liked the atmosphere in the new stores.',
          options: ['TRUE', 'FALSE', 'NOT GIVEN']
        },

        // Complete notes - NO MORE THAN TWO WORDS
        {
          id: 6,
          type: 'written',
          question: 'TF team limited their research to attitudes that occur at a ______ level in customers\' minds'
        },
        {
          id: 7,
          type: 'written',
          question: 'Use: help people achieve ______'
        },
        {
          id: 8,
          type: 'written',
          question: 'giving the product a ______ that seems helpful and supportive'
        },
        {
          id: 9,
          type: 'written',
          question: 'giving the product a reusable ______'
        },
        {
          id: 10,
          type: 'written',
          question: 'good information can come from interviews or studying the ______ of consumers in the home'
        },
        {
          id: 11,
          type: 'written',
          question: 'we organized ______ to find out what images customers associate with our products'
        },
        {
          id: 12,
          type: 'written',
          question: 'can be basic, e.g. by doing ______'
        },
        {
          id: 13,
          type: 'written',
          question: 'company executives should follow their ______'
        }
      ]
    },

    {
      title: 'PASSAGE 2',
      passage: `Keeping the water away
New approaches to flood control

A Recently, winter floods on the rivers of central Europe have been among the worst for 600 to 700 years, and dams and dykes (protective sea walls) have failed to solve the problem, Traditionally, river engineers have tried to get rid of the water quickly, draining it off the land and down to the sea in rivers re-engineered as high-performance drains. But however high they build the artificial riverbanks, the floods keep coming back. And when they come, they seem to be worse than ever.

B Engineers are now turning to a different plan: to sap the water's destructive strength by dispersing it into fields, forgotten lakes and flood plains. They are reviving river bends and marshes to curb the flow, and even plugging city drains to encourage floodwater to use other means to go underground. Back in the days when rivers took a winding path to the sea, floodwaters lost force and volume while meandering across food plains and inland deltas, but today the water tends to have a direct passage to the sea. This means that, when it rains in the uplands, the water comes down all at once.

C Worse, when the flood plains are closed off, the river's flow downstream becomes more violent and uncontrollable; by turning complex river systems into the simple mechanics of a water pipe, engineers have often created danger where they promised safety. The Rhine, Europe's most engineered river, is a good example. For a long time, engineers have erased its backwaters and cut it off from its flood plain. The aim was partly to improve navigation, and partly to speed floodwaters out of the Alps and down to the North Sea. Now, when it rains hard in the Alps, the peak flows from several branches of the Rhine coincide where once they arrived separately, and with four-fifths of the Lower Rhine's flood plain barricaded of the waters rise. The result is more frequent flooding and greater damage. The same thing has happened in the US on the Mississippi river, which drains the world's second largest river catchment into the Gulf Mexico. Despite some $7 billion spent over the last century on levees (embankments), the situation is growing worse.

D Specialists in water control now say that a new approach is needed – one which takes the whole landscape into consideration. To help keep London's feet dry, the UK Environment Agency is reflooding 10 square kilometres of the ancient flood plain of the River Thames outside Oxford. Nearer to London, it has spent £100 million creating new wetlands and a relief channel across 16 kilometres of flood plain. Similar ideas are being tested in Austria, in one of Europe's largest river restorations to date. The engineers calculate that the restored flood plain of the Drava River can now store up to 10 million cubic metres of floodwater, and slow down storm surges coming out of the Alps by more than an hour, protecting towns not only in Austria, but as far downstream as Slovenia and Croatia.

E The Dutch, for whom preventing floods is a matter of survival, have gone furthest. This nation, built largely on drained marshes and seabed, has had several shocks in the last two decades, when very large numbers of people have had to be evacuated. Since that time, the Dutch have broken one of their most enduring national stereotypes by allowing engineers to punch holes in dykes. They plan to return up to sixth of the country to its former waterlogged state in order to better protect the rest.

F Water use in cities also needs to change. At the moment, cities seem designed to create floods: they are concreted and paved so that rains flow quickly into rivers. A new breed of 'soft engineers' wants cities to become porous. Berlin is one place where this is being done. Tough new rules for new developments mean that drains will be prevented from becoming overloaded after heavy rains. Architects of new urban buildings are diverting rainwater from the roofs for use in toilets and the irrigation of roof gardens, while water falling onto the ground is collected in ponds, or passes underground through porous paving. One high-tech urban development can store a sixth of its annual rainfall, and reuse most of the rest.

G Could this be expanded to protect a whole city? The test case could be Los Angeles. With non-porous surfaces covering 70％of the city, drainage is a huge challenge. Billions of dollars have been spent digging huge drains and concreting riverbeds, but many communities still flood regularly. Meanwhile this desert city ships water from hundreds of kilometres away to fill is taps and swimming pools, Los Angeles has recently launched a new scheme to utilise floodwater in the Sun Valley section of the city. The plan is to catch the rain that falls on thousands of driveways, parking lots and rooftops in the valley. Trees will soak up water from parking lots; houses and public buildings will capture roof water to irrigate gardens and parks, and road drains will empty into old gravel pits to recharge the city's underground water reserve. Result: less flooding and more water for the city. It may sound expensive, until we realise how much is spent trying to drain cities and protect areas from flooding, and how little this method achieves.`,

      questions: [
        // Which paragraph contains information (A–G)
        {
          id: 14,
          type: 'matchinggroup',
          subIds: [14, 15, 16, 17, 18, 19],
          displayId: '14–19',
          question: 'Questions 14–19: Which paragraph contains the following information? Choose ONE letter (A–G) per row.',
          columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
          rows: [
            'how legislation has forced building designers to improve water use',
            'two reasons why one river was isolated from its flood plain',
            'how natural water courses in the past assisted flood control',
            'an example of flood control on one river, affecting three countries',
            'a country which has partly destroyed one of its most typical features in order to control water',
            'the writer\'s comment on the comparative cost effectiveness of traditional flood control and newer methods'
          ]
        },

        // Choose TWO letters (A–E)
        {
          id: 20,
          type: 'mcq',
          question: 'Questions 20–21: Choose TWO letters, A-E. According to the article, which TWO of these statements are true of the new approach to flood control?',
          options: [
            'A It aims to slow the movement of water to the sea.',
            'B It aims to channel water more directly into rivers.',
            'C It will cost more than twice as much as former measures.',
            'D It will involve the loss of some areas of land.',
            'E It has been tested only in The Netherlands.'
          ]
        },
        {
          id: 21,
          type: 'mcq',
          question: 'Questions 20–21: Choose TWO letters, A-E. According to the article, which TWO of these statements are true of the new approach to flood control?',
          options: [
            'A It aims to slow the movement of water to the sea.',
            'B It aims to channel water more directly into rivers.',
            'C It will cost more than twice as much as former measures.',
            'D It will involve the loss of some areas of land.',
            'E It has been tested only in The Netherlands.'
          ]
        },

        // Complete sentences (NO MORE THAN TWO WORDS)
        {
          id: 22,
          type: 'written',
          question: 'Some of the most severe floods for many centuries have recently occurred in parts of ______.'
        },
        {
          id: 23,
          type: 'written',
          question: 'The Rhine and the ______ rivers have experienced similar problems with water control.'
        },
        {
          id: 24,
          type: 'written',
          question: 'An area near Oxford will be flooded to protect the city of ______.'
        },
        {
          id: 25,
          type: 'written',
          question: 'Planners who wish to allow water to pass more freely through city surfaces are called ______.'
        },
        {
          id: 26,
          type: 'written',
          question: 'A proposal for part of the city of ______ could show weather small-scale water projects could apply a large scale.'
        }
      ]
    },

    {
      title: 'PASSAGE 3',
      passage: `Australia's Megafauna Controversy
Just how long did humans live side by side with megafauna in Australia?
Barry Brook, Richard Gillespie and Paul Martin dispute previous claims of a lengthy coexistence.

Over the past 50 millennia, Australia has witnessed the extinction of many species of large animals, including rhinoceros-sized wombat and goannas the size of crocodiles. Debate about the possible cause of these extinctions has continued for more than 150 years and one of the crucial questions raised is how long humans and megafauna coexisted in Australia. We need to know the overlap of time to make an informed choice between the two main theories regarding the causes of these extinctions. If humans and megafauna coexisted for a protracted period then climate change is the more likely cause. However, if the megafauna became extinct shortly after the arrival of humans, then humans are the likely culprits.

The archaeological site at Cuddie Springs in eastern Australia appears to be well preserved. This dusty claypan holds within its sediments a rich cache of flaked stone and seed-grinding tools, and side by side with these clear signals of human culture are the bones of a dozen or more species of megafauna. Drs Judith Field and Stephen Wroe of the University of Sydney, who excavated the site, claim that it provides unequivocal evidence of a long overlap of humans and megafauna, and conclude that aridity leading up to the last Ice Age brought about their eventual demise. In the long-standing explanation of this site, artefacts such as stone tools and extinct animal remains were deposited over many thousands of years in an ephemeral lake – a body of water existing for a relatively short time – and remained in place and undisturbed until the present day.

There is no disputing the close association of bones and stones at Cuddle Springs, as both are found 1 to 1.7 metres below the modern surface. The dating of these layers is accurate: ages for the sediments were obtained through radiocarbon dating of charcoal fragments and luminescence dating of sand grains from the same levels (revealing when a sample was last exposed to sunlight). Intriguingly, some of the stone tools show surface features indicating their use for processing plants, and a few even have well-preserved blood and hair residues suggesting they were used in butchering animals.

But is the case proposed by Field and Wroe clear-cut? We carried out a reanalysis of the scientific data from Cuddie Springs that brings into question their conclusions. The amount of anthropological evidence found at the site is remarkable: we estimate there are more than 3 tonnes of charcoal and more than 300 tonnes of stone buried there. Field and Wroe estimate that there are approximately 20 million artefacts. This plethora of tools is hard to reconcile with a site that was only available for occupation when the lake was dry. Furthermore, no cultural features such as oven pits have been discovered. If the sediment layers have remained undisturbed since being laid down, as Field and Wroe contend, then the ages of those sediments should increase with depth. However, our analysis revealed a number of inconsistencies.

First, the charcoal samples are all roughly 36,000 years old. Second, sand in the two upper levels is considerably younger than charcoal from the same levels. Third, Field and Wroe say that the tools and seed-grinding stones used for plant and animal processing are ancient, yet they are very similar to implements found elsewhere that were in use only a few thousand years ago. Also of interest is the fact that a deep drill core made a mere 60 metres from the site recovered no stone artefacts or fossil bones whatsoever. These points suggest strongly that the sediments have been moved about and some of the old charcoal has been re-deposited in younger layers. Indeed, one sample of cow bone found 1 metre below the surface came from sediments where charcoal dated at 6,000 and 23,000 years old is mixed with 17,000-year-old sand. The megafauna bones themselves have not yet been dated, although new technological developments make this a possibility in the near future.

We propose that the archaeologists have actually been sampling the debris carried by ancient food channels beneath the site, including charcoal transported from bushfires that intermittently occurred within the catchment. Flood events more likely explain the accumulation of megafauna remains, and could have mixed old bones with fresh deposits. European graziers also disturbed the site in 1876 by constructing a well to provide water for their cattle. Given the expense of well-digging, we speculate that the graziers made sure it was protected from the damage caused by cattle hooves by lining the surface with small stones collected from further afield, including prehistoric quarries. This idea is consistent with the thin layer of stones spread over a large area, with Cattle occasionally breaking through the gravel surface and forcing the stone and even cattle bones deeper into the waterlogged soil.

The lack of conclusive evidence that humans and megafauna coexisted for a lengthy period casts doubt on Field and Wroe's assertion that climate change was responsible for the extinction of Australia's megafauna. However, we do not suggest that newly arrived, well-armed hunters systematically slaughtered all the large beasts they encountered. Recent studies based on the biology of modern-day large mammals, combined with observations of people who still practise a traditional hunter-gatherer lifestyle, reveal an unexpected paradox and suggest a further possible explanation as to what happened. Using a mathematical model, it was found that a group of 10 people killing only one juvenile Diprotodon each year would be sufficient to bring about the extinction of that species within 1,000 years. This suggests that here, as in other parts of the world, the arrival of humans in lands previously inhabited only by animals created a volatile combination in which large animals fared badly.`,

      questions: [
        // YES / NO / NOT GIVEN
        {
          id: 27,
          type: 'mcq',
          question: 'Field and Wroe argue that findings at the Cuddie Springs site show that people lived in this area at the same time as megafauna.',
          options: ['YES', 'NO', 'NOT GIVEN']
        },
        {
          id: 28,
          type: 'mcq',
          question: 'Field and Wroe believe it is likely that smaller megafauna species survived the last Ice Age.',
          options: ['YES', 'NO', 'NOT GIVEN']
        },
        {
          id: 29,
          type: 'mcq',
          question: 'The writers believe that the dating of earth up to 1.7m below the present surface Cuddie Springs is unreliable.',
          options: ['YES', 'NO', 'NOT GIVEN']
        },
        {
          id: 30,
          type: 'mcq',
          question: 'Some artefacts found at Cuddie Springs were preserved well enough to reveal that function.',
          options: ['YES', 'NO', 'NOT GIVEN']
        },

        // Complete summary using word list (A–I)
        {
          id: 31,
          type: 'matchinggroup',
          subIds: [31, 32, 33, 34, 35],
          displayId: '31–35',
          question: 'Questions 31–35: Complete the summary using the list of words A-I. Choose ONE option per row.',
          columns: [
            'A seeds',
            'B stone', 
            'C sand',
            'D cooking',
            'E deep drill core',
            'F water',
            'G fossil bones',
            'H sediment',
            'I storage'
          ],
          rows: [
            'One objection to Field and Wroe\'s interpretation is the large quantity of charcoal, ______ and artefacts found at Cuddie Springs.',
            'Such large numbers of artefacts would be impossible if the area had been covered with ______ for a period.',
            'There is also a complete lack of man-made structures, for instance those used for ______.',
            'Other evidence that casts doubt on Field and Wroe\'s claim is the fact that while some material in the highest levels of sediment is 36,000 years old, the ______ in the same levels is much more recent.',
            'Further evidence against human occupation of the area is the absence of tools and ______ just a short distance away.'
          ]
        },

        // Multiple choice (A, B, C, D)
        {
          id: 36,
          type: 'mcq',
          question: 'What conclusions did the writers reach about the inconsistencies in the data from Cuddie Springs?',
          options: [
            'A The different layers of sediment have been mixed over time.',
            'B The sand evidence is unhelpful and should be disregarded.',
            'C The area needs to be re-examined when technology improves.',
            'D The charcoal found in the area cannot be dated.'
          ]
        },
        {
          id: 37,
          type: 'mcq',
          question: 'According to the writers, what impact could a natural phenomenon have had on this site?',
          options: [
            'A Floods could have caused the death of the megafauna.',
            'B Floods could have disturbed the archaeological evidence.',
            'C Bushfires could have prevented humans from settling in the area for any length of time.',
            'D Bushfires could have destroyed much of the evidence left by megafauna and humans.'
          ]
        },
        {
          id: 38,
          type: 'mcq',
          question: 'What did the writers speculate about the people who lived at this site in 1876?',
          options: [
            'A They bred cattle whose bones could have been confused with megafauna.',
            'B They found that the soil was too waterlogged for farming.',
            'C They allowed cattle to move around freely at the site.',
            'D They brought stones there from another area.'
          ]
        },
        {
          id: 39,
          type: 'mcq',
          question: 'In the final paragraph, what suggestion do the writers make about Australia\'s megafauna?',
          options: [
            'A A rapid change in climate may have been responsible for the extinction of the megafauna.',
            'B Megafauna could have died out as a result of small numbers being killed year after year.',
            'C The population of humans at that time was probably insufficient to cause the extinction of the megafauna.',
            'D The extinction of ancient animals should not be compared to that of modern-day species.'
          ]
        },
        {
          id: 40,
          type: 'mcq',
          question: 'Which of the following best represents the writer\'s criticism of Field and Wroe?',
          options: [
            'A Their methods were not well thought out.',
            'B Their excavations did not go deep enough.',
            'C Their technology failed to obtain precise data.',
            'D Their conclusions were based on inconsistent data.'
          ]
        }
      ]
    }
  ]
};

export default test9;