//const pinyin = require('tiny-pinyin')
const pinyin = require('chinese_pinyin');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

(async () => {

  const db = await open({
    filename: 'E:\\iPod_Control\\iTunes\\iTunes Library.itlp\\Library.itdb',
    driver: sqlite3.Database
  })

  // artists
  console.log("###############################################################");
  console.log("# Udating artists");

  let artistRows = await db.all("SELECT CAST(pid AS TEXT) as pid, sort_name FROM track_artist");
  await Promise.all(artistRows.map(row => {
    let converted_sort_name = pinyin(row.sort_name);
    let prefix = (converted_sort_name[0].match(/[a-zA-Z]/) ? converted_sort_name[0].toUpperCase() : "#") + ". ";
    converted_sort_name = prefix + converted_sort_name.replace(/^[A-Z#]\. /, "");
    if (row.sort_name != converted_sort_name) {
      console.log(row.pid + ": " + row.sort_name + " -> " + converted_sort_name);
      return db.run("UPDATE track_artist SET sort_name = ? WHERE pid = ?", converted_sort_name, row.pid);
    }
  }));

  console.log("");

  let albumOrder = 100;
  let sortedArtistRows = await db.all("SELECT CAST(pid AS TEXT) as pid, name FROM track_artist ORDER BY CASE WHEN sort_name LIKE '#. %' THEN 1 ELSE 0 END, sort_name")
  await Promise.all(sortedArtistRows.map(row => {
    console.log(albumOrder + ": " + row.name);
    db.run("UPDATE track_artist SET name_order = ? WHERE pid = ?", albumOrder, row.pid);
    albumOrder += 100;
  }));

  console.log("");

  // titles
  console.log("###############################################################");
  console.log("# Udating titles");

  let titleRows = await db.all("SELECT CAST(pid AS TEXT) as pid, title, sort_title, sort_artist FROM item");
  await Promise.all(titleRows.map(row => {
    let converted_sort_title = pinyin(row.sort_title);
    let converted_sort_artist = pinyin(row.sort_artist);
    let prefix = (converted_sort_artist[0].match(/[a-zA-Z]/) ? converted_sort_artist[0].toUpperCase() : "#") + ". ";
    converted_sort_title = prefix + converted_sort_title.replace(/^[A-Z#]\. /, "");
    converted_sort_artist = prefix + converted_sort_artist.replace(/^[A-Z#]\. /, "");
    if (row.sort_title != converted_sort_title || row.sort_artist != converted_sort_artist) {
      console.log(row.pid + ": " + row.sort_artist + " - " + row.sort_title + " -> " + converted_sort_artist + " - " + converted_sort_title);
      return db.run("UPDATE item SET sort_title = ?, sort_artist = ? WHERE pid = ?", converted_sort_title, converted_sort_artist, row.pid);
    }
  }));

  console.log("");

  let titleOrder = 100;
  let sortedTitleRows = await db.all("SELECT CAST(pid AS TEXT) as pid, artist, title FROM item  ORDER BY CASE WHEN sort_artist LIKE '#. %' THEN 1 ELSE 0 END, sort_artist, CASE WHEN sort_title LIKE '#. %' THEN 1 ELSE 0 END, sort_title");
  await Promise.all(sortedTitleRows.map(row => {
    console.log(titleOrder + ": " + row.artist + " - " + row.title);
    db.run("UPDATE item SET title_order = ? WHERE pid = ?", titleOrder, row.pid);
    titleOrder += 100;
  }));

  console.log("");

  await db.close();
})();
