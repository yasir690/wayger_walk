// function dayRangeUTC(startDate, endDate) {
//   const start = new Date(startDate);
//   const end = new Date(endDate);

//   const startDayUTC = new Date(Date.UTC(
//     start.getUTCFullYear(),
//     start.getUTCMonth(),
//     start.getUTCDate(),
//     0, 0, 0, 0
//   ));

//   const endDayExclusiveUTC = new Date(Date.UTC(
//     end.getUTCFullYear(),
//     end.getUTCMonth(),
//     end.getUTCDate() + 1,
//     0, 0, 0, 0
//   ));

//   return { startDayUTC, endDayExclusiveUTC };
// }

// module.exports = dayRangeUTC;


function dayRangeUTC(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startDayUTC = new Date(Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate(),
    0, 0, 0, 0
  ));

  const endDayInclusiveUTC = new Date(Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate(),
    23, 59, 59, 999
  ));

  return { startDayUTC, endDayInclusiveUTC };
}

module.exports = dayRangeUTC;
