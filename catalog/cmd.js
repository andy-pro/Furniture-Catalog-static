var api = require('./api'),
    cmd = process.argv[2];

if (cmd == 'help' || !cmd) {
  console.log('\033[1;32mindex:\033[0m\n\
0 - Кухни "Классика"\n\
1 - Кухни "Модерн"\n\
2 - Шкафы-купе\n\
3 - Прихожие\n\
4 - Гостиные\n\
5 - Офисная\n\
6 - Детские\n\
7 - Разное\n\
\033[1;33mcommands:\033[0m\n\
node cmd.js deleteThumbs index\n\
node cmd.js createThumbs index\n\
node cmd.js updateThumbs index');
} else {
  var f = api[cmd];
  if (typeof f == 'function') f(process.argv[3]);
  else console.log('no command');
}
