# VirtualDataGrid

Ez a magyar nyelvű README fájl, visszatérni az angol nyelvűre [ide](https://github.com/Wh1teRabbitHU/VirtualDataGrid) kattintva tudsz

## <a id="contents"></a> Tartalomjegyzék

- [Tartalomjegyzék](#contents)
- [Összefoglaló](#summary)
- [Funkcionalitások](#features)
- [Beállítások](#options)
- [Funkcionális leírások](#functional_descriptions)
	- [Tábla generálása](#generate_table)
	- [Sorbarendezés](#sort)
	- [Szűrés](#filter)
	- [Szerkesztés](#edit)
- [Publikus függvények](#public_functions)
- [Korlátok](#boundaries)
- [Licensz](#licence)

## <a id="summary"></a> Összefoglaló

### Mi is az a VirtualDataGrid?

Ez a project azért jött létre, hogy egy gyors és könnyen kezelhető alternatívát nyújtson a jelenleg a piacon fellelhető táblakezelő rendszereknek. Az alapötlet ahogy működik a táblázat egyedülálló, aminek köszönhetően több millió cellát képes lekezelni akadásmentesen. Elsődleges célom egy könnyen kezelhető, gyors, mégis testreszabható megoldás készítése.

### Hogyan teszi mindezt?

Nem túl technikai jellemzéssel élve úgy jelenítődik meg az adat, hogy mindig csak az aktuálisan látható cellákat kezeljük és töltjük ki. Görgetéskor a cellák tartalmai kicserélődnek oly módon, hogy a váltás nem észrevehető, ezáltal azt a hatást keltve, hogy egy teljes táblázat került megjelenítésre. Természetesen ennek a rendszernek a megoldásból adódóan megvannak a maga hátrányai és korlátai, amik csak nagy erőforrásigényes számolásokkal lennémnek kiküszöbőlhetőek. Pont emiatt, bár a legtöbb használati esetre tökéletesen megfelel ez a project, érdemes végigolvasni mit és mit nem tud nyújtani a projected számára! Terveim szerint funkcionálisan folyamatosan bővülni fog, vannak olyan részei a táblázatkezelőnek amit pont ezek miatt a korlátok miatt nem fogok belefejleszteni.

A teljes funkciolistát [itt](#features), a rendszer korlátait pedig [itt](#boundaries) tekintheted meg

## <a id="features"></a> Funkcionalitások

A jelenlegi funkcionalitás kulcsszavakban: (a lista folyamatosan bővül majd, ahogy a fejlesztés halad előre)

- Gyors megjelenítés, akár több millió cellával
- Több soros fejléc kezelése
- Fejléc esetén cellák összevonása
- Fix oszlopok kezelése
- Sorbarendezés oszloponkként (típus szerint, vagy akár saját összehasonlító függvénnyel is!)
- Keresés oszloponkként (típus szerint, vagy akár saját szűrő függvénnyel is!)

Jövőbeli célok, funkciók kulcsszavakban:

- Szerkesztés, típusonkként különböző megvalósítással
- Soronkénti vagy kötegelt mentés
- Oszlopok átrendezhetősége
- Adat csoportok létrehozása
- Összegzések oszloponkként, csoportonkként
- Egyedi cellaformázás
- Egyedi adatmegjelenítés
- Párhuzamos szerkesztés kezelése, jelzése
- Data-binding szerverrel websocketen vagy ajaxon keresztül
- Sorok kijelölése, csoportos műveletek (szerkesztés, törlés, egyedi felhasználás eventek segítségével)
- Objektum alapú fejléc generálás (komplex entitások esetén intelligens módon megadható elemek, amik automatikusan generálják a változó számú oszlopokat)
- Telefonos támogatás
- Validáció, akár saját szabályok megadásával is
- Állapot panel, irányító gombokkal (mentés, validációs hibák jelzése, lépkedés a szerkesztett cellák közt, stb)
- Dinamikusan módosítható beállítások és adatszerkezet bevezetése publikus függvényekkel
- Az adatok aszinkron betöltési lehetőségei (soronként, szegmensenként vagy az egészet háttérben)

## <a id="options"></a> Beállítások

### A létrehozás során megadandó beállítás objektum attribútumai

|              Kulcs               |  Típus   | Alapértelmezett érték |                                        Rövid leírás                                       |
|----------------------------------|----------|-----------------------|-------------------------------------------------------------------------------------------|
| selectors                        | Objektum | {}                    | A selectorokat tartalmazó objektum                                                        |
| selectors.mainContainer          | Szöveg   | '.data-container'     | A táblázatot tartalmazó fő elem selectora                                                 |
| selectors.saveButton             | Szöveg   | null                  | A mentést végző gomb selectora.                                                           |
|                                  |          |                       | Ha nincs beállítva akkor az event nem fog foglalkozni vele mentésnél.                     |
| dimensions                       | Objektum | {}                    | A táblázat méretezési beállításait tartalmazó objketum                                    |
| dimensions.cellWidth             | Szám     | 150                   | A cellák szélességét adja meg  pixelben                                                   |
| dimensions.cellHeight            | Szám     | 50                    | A cellák magasságát adja meg pixelben                                                     |
| dimensions.cellPaddingVertical   | Szám     | 4                     | A cellák vertikális paddingja pixelben                                                    |
| dimensions.cellPaddingHorizontal | Szám     | 8                     | A cellák horizontális paddingja pixelben                                                  |
| dimensions.cellBorderWidth       | Szám     | 1                     | A cellák borderjének szélességét adja meg                                                 |
| edit                             | Objektum | {}                    | A szerkesztéshez tartozó beállításokat tartalmazó objektum                                |
| edit.enabled                     | Boolean  | false                 | 'true' érték esetén szerkeszthetőek csak a cellák globálisan                              |
| filter                           | Objektum | {}                    | A szűréshez tartozó beállításokat tartalmazó objektum                                     |
| filter.enabled                   | Boolean  | false                 | 'true' érték esetén globálisan engedélyezve lesz minden oszlopra a szűrés.                |
|                                  |          |                       | Minden oszlopnak az adattípusa alapján fog a szűrő mező megjelenni                        |
| filter.customFilter              | Függvény | null                  | Ha megvan adva egy függvény ennek a mezőnek, akkor globálisan lehet egyénileg             |
|                                  |          |                       | kezelni a szűrést. Ehhez szükség van arra, hogy a szűrés típusának 'custom'-ot            |
|                                  |          |                       | adjunk meg a cél oszlopban                                                                |
| sort                             | Objektum | {}                    | A sorbarendezéshez tartozó beállításokat tartalmazó objektum                              |
| sort.enabled                     | Boolean  | false                 | 'true' érték esetén globálisan engedélyezve lesz minden oszlopra a sorbarendezés          |
| sort.default                     | Szöveg   | Az első oszlop kulcsa | Az alapértelmezett szűrés oszlopát adhatjuk meg ezzel a beállítással.                     |
| sort.customSort                  | Függvény | null                  | Ha megadjuk ezt a függvényt, akkor globálisan lehet egyénileg kezelni a sorbarendezést    |
|                                  |          |                       | A megadott függvény határozza meg a sorbarendezés során, hogy miylen sorrendbe lesznek    |
|                                  |          |                       | megjelenítve a cellák                                                                     |
| eventHandlers                    | Objektum | {}                    | Az eseménykezelő függvényeket lehet megadni ebben az objektumban                          |
| eventHandlers.onBeforeEdit       | Függvény | null                  | Szerkesztés előtt lefutó függvény. Lehetőség van megszakítani is a szerkesztést a saját   |
|                                  |          |                       | függvényünkön belül                                                                       |
| eventHandlers.onValidation       | Függvény | null                  | Validációkor lefutó egyéni függvény. Saját ellenőrzés után akár meg is szakítható         |
|                                  |          |                       | a mentés folyamata!                                                                       |
| eventHandlers.onAfterEdit        | Függvény | null                  | Szerkesztés után lefutó függvény. Utólagos számolásokhoz használható                      |
| eventHandlers.onBeforeSave       | Függvény | null                  | Mentés előtt lefutó függvény. Lehetőség van megszakítani a mentés folyamatát ezen belül   |
| eventHandlers.onAfterSave        | Függvény | null                  | A mentést követően lefutó függvény. A mentés utáni igazításokhoz használható              |
| locale                           | Objektum | {}                    | A regionális beállításokat tartalmazó objektum                                            |
| locale.name                      | Szöveg   | 'en'                  | A szövegek hely alapú kezelése érdekében megadható országkód. Pl sorbarendezéskor az      |
|                                  |          |                       | összehasonlítás esetén                                                                    |
| dataSource                       | Tömb     | []                    | A tábla elemeit tartalmazó tömb. Soronként egy objektum elemet tartalmaz                  |
| headers                          | Tömb     | [ [] ]                | A fejlécek beállításait tartalmazó tömb. A tömb elemei soronkénti leíró tömbök. Minden    |
|                                  |          |                       | sor egy-egy tömb, aminek az elemei az oszlopot leíró objektumok.                          |
| fixedHeaders                     | Tömb     | [ [] ]                | A rögzített fejlécek beállításait tartalmazó tömb. A tömb elemei soronkénti leíró tömbök. |
|                                  |          |                       | Minden sor egy-egy tömb, aminek az elemei az oszlopot leíró objektumok.                   |
| uniqueId                         | Szám     | 0                     | A táblázat egyedi azonosító száma. 1 től növekvően kerülnek kiosztásra  az azonosítók     |

### A header és a fixedHeader tömbökben lévő, az adott oszlopra vonatkozó beállításokat tartalmazó objektumok attribútumai.

|     Kulcs      |  Típus  | Alapértelmezett érték |                                              Rövid leírás                                             |
|----------------|---------|-----------------------|-------------------------------------------------------------------------------------------------------|
| key            | Szöveg  | null                  | Az adott oszlopot beazonosító kulcs. Az utolsó sort leíró objektumokban kötelező mező!                |
| text           | Szöveg  | key                   | Az adott fejlécben megjelenő szöveg. Ha ninccs megadva, akkor a kulcs kerül megjelenítésre            |
| dataType       | Szöveg  | 'string'              | Az adott oszlopban lévő elemek típusa. Ez határozza meg a szűrést, sorbarendezést és szerkesztést is! |
| filterType     | Szöveg  | 'equals'              | A szűrő által használt összehasonlítási eljárás neve.                                                 |
| filterDisabled | Boolean | false                 | Az adott oszlop szűrési lehetőségének kikapcsolására szolgáló beállítás                               |
| sortDisabled   | Boolean | false                 | Az adott oszlop sorbarendezési lehetőségének kikapcsolására szolgáló beállítás                        |

## <a id="functional_descriptions"></a> Funkcionális leírások

### <a id="generate_table"></a> Tábla generálás

### <a id="sort"></a> Sorbarendezés

### <a id="filter"></a> Szűrés

### <a id="edit"></a> Szerkesztés

## <a id="public_functions"></a> Publikus függvények

## <a id="boundaries"></a> Korlátok

Az alábbiak a későbbiekben még bekerülhetnek az alkalmazásba, azonban jelenleg ez nincs tervben:

- Soronkénti vagy oszloponkkénti különböző méretezés (a számítási igény megnövekedése miatt)
- Méretezhető mezők

## <a id="licence"></a> Licensz

#### GNU GENERAL PUBLIC LICENSE - GPL 3.0

[Hivatkozás](https://www.gnu.org/licenses/gpl-3.0.txt) a licensz teljes tartalmára.