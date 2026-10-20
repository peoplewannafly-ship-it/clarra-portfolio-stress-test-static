// Explicitly approved by the owner on 20 October: extend, never reuse, launch IDs.
export const launchIds = [
  'MP01','MP02','MP03','MP04','MP05','MP06','MP07','MP08',
  'T01','T02','T03','T04','T05','T06','T07','T08','T09','T10','T11','T12',
];
export const newPinIds = [
  'MP09','MP10','MP11','MP12','MP13','MP14','MP15','MP16','MP17','MP18',
  'MP19','MP20','MP21','MP22','MP23','MP24','MP25','MP26','MP27',
];
export const approvedIds = new Set([...launchIds, ...newPinIds]);
