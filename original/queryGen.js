module.exports = { 
  defectParetoWeeks,
  dailyRecordWeeks,
  getLatestWeek }

function defectParetoWeeks (startWeek, endWeek) {
  // refrain from using BETWEEN as the engine has to interpret each time and cause delay.
  return `
  EXEC	DefectParetoData ${startWeek}, ${endWeek};
  `
}

function dailyRecordWeeks (startWeek, endWeek) {
  return `
  EXEC DailyRecordWeeks ${startWeek}, ${endWeek};
  `
}

function getLatestWeek (weeks = "") {
  return `
  EXEC	GetLatestWeek ${weeks};
  `
}