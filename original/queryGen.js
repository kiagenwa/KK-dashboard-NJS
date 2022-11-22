module.exports = { defectCriterions }

function defectCriterions (days, pdtype) {
  // This query returns defectname, qty, and dppm for each item
  // on the specific pdtype in the last specified days.
  return `
  DECLARE @TTL_PD_QTY FLOAT;
  DECLARE @DAYS_DATA INT;
  DECLARE @PD_TYPE INT;

  SET @PD_TYPE = ${pdtype};
  SET @DAYS_DATA = ${days};

  SELECT @TTL_PD_QTY = SUM(PDinput)
  FROM dailyPD
  WHERE pdtypeID = (@PD_TYPE) AND dailyPD.dateID IN 
    (SELECT DISTINCT TOP (@DAYS_DATA) dateID FROM dailyPD ORDER BY dateID DESC);

  SELECT defectname, 
    quantity,
    CAST(quantity/@TTL_PD_QTY*1000000 AS INT) dppm
  FROM 
  (SELECT
    defectname, sum(qty) quantity 
  FROM 
    dailydefects LEFT JOIN 
    defect ON dailydefects.defectID = defect.ID 
    WHERE pdtypeID = (@PD_TYPE) AND dateID IN 
    (SELECT DISTINCT TOP (@DAYS_DATA) dateID FROM dailyPD ORDER BY dateID DESC) 
    GROUP BY defectname
  UNION ALL
  SELECT 'TOTAL', sum(qty)
  FROM 
    dailydefects LEFT JOIN 
    defect ON dailydefects.defectID = defect.ID 
    WHERE pdtypeID = (@PD_TYPE) AND dateID IN 
    (SELECT DISTINCT TOP (@DAYS_DATA) dateID FROM dailyPD ORDER BY dateID DESC)
  ) x
  ORDER BY CASE WHEN x.defectname = 'TOTAL' THEN 1 ELSE 0 END, quantity DESC
  `
}

