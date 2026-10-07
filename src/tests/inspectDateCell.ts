import { parseExcelDate } from '../utils/dateUtils';

console.log('46235 (Aug 1, 2026):', parseExcelDate(46235));
console.log('46266 (Sep 1, 2026):', parseExcelDate(46266));
console.log('"Meeting  -1 ":', parseExcelDate('Meeting  -1 '));
console.log('"Office":', parseExcelDate('Office'));
console.log('"8/6/2026":', parseExcelDate('8/6/2026'));
console.log('"2026-09-04":', parseExcelDate('2026-09-04'));
