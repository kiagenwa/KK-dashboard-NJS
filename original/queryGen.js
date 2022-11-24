module.exports = { 
  defectPareto,
  dailyRecord }

function defectPareto (days, pdtype) {
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

function dailyRecord (days, pdtype) {
  return `
  DECLARE @DAYS_DATA INT;
  DECLARE @PD_TYPE INT;
  
  SET @PD_TYPE = ${pdtype};
  SET @DAYS_DATA = ${days};
  
  SELECT
    TOP (@DAYS_DATA)
    dailyPD.dateID,
    PDinput,
    PDoutput,
    d.defect_qty,
    dailyPD.modelID,
    fullname model_name,
    recorddate,
    weeknum
  FROM
    dailyPD LEFT JOIN
    model ON dailyPD.modelID = model.ID LEFT JOIN
    datetable ON dailyPD.dateID = datetable.ID LEFT JOIN
    (
    SELECT
    dateID,
    SUM(qty) defect_qty,
    modelID
  FROM
    dailydefects LEFT JOIN
    defect ON dailydefects.defectID = defect.ID
  WHERE pdtypeID = (@PD_TYPE)
  GROUP BY
    dateID, modelID
    ) d ON dailyPD.dateID = d.dateID AND dailyPD.modelID = d.modelID
  WHERE pdtypeID = (@PD_TYPE)
  ORDER BY
    dateID DESC;
  `
}