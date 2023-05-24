const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(9004, () => {
      console.log("DB connected successfully at 9004");
    });
  } catch (error) {
    console.log("error detected at 9002");
  }
};

initializeDBandServer();

//API 1
app.get("/states/", async (request, response) => {
  const statesQuery = `
    SELECT * FROM state;
    `;
  const statesArray = await db.all(statesQuery);
  const updatedData = statesArray.map((eachItem) => ({
    stateId: eachItem.state_id,
    stateName: eachItem.state_name,
    population: eachItem.population,
  }));
  response.send(statesArray);
});

//API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `
    SELECT * FROM state WHERE state_id=${stateId};
    `;
  const stateItem = await db.get(stateQuery);
  const { state_id, state_name, population } = stateItem;
  const updatedStateData = {
    stateId: state_id,
    stateName: state_name,
    population: population,
  };
  response.send(updatedStateData);
});

//API 3
app.post("/districts/", async (request, response) => {
  const diseaseDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = diseaseDetails;
  const createDistrictQuery = `
    INSERT INTO district(
      district_name,state_id,cases,cured,active,deaths
    )
    VALUES(
        '${districtName}',
        '${stateId}',
        '${cases}',
        '${cured}',
        '${active}',
        '${deaths}'
    );
  `;
  const dbResponse = await db.run(createDistrictQuery);
  const districtId = dbResponse.lastID;
  //response.send({ districtId: districtId });
  response.send("District Successfully Added");
});

//API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT 
        * 
    FROM 
    district 
    WHERE district_id=${districtId}
    `;
  const getDistrict = await db.get(getDistrictQuery);
  const {
    district_id,
    district_name,
    state_id,
    cases,
    cured,
    active,
    deaths,
  } = getDistrict;
  const updatedData = {
    districtId: district_id,
    districtName: district_name,
    stateId: state_id,
    cases: cases,
    cured: cured,
    active: active,
    deaths: deaths,
  };

  response.send(updatedData);
});

//API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
    DELETE 
    FROM district 
    WHERE district_id=${districtId}
    `;
  await db.run(deleteQuery);
  response.send("District Removed");
});

//API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateQuery = `
    UPDATE 
    district 
    SET 
    district_name='${districtName}',
    state_id='${stateId}',
    cases='${cases}',
    cured='${cured}',
    active='${active}',
    deaths='${deaths}'
    WHERE district_id=${districtId};
    `;
  await db.run(updateQuery);
  response.send("District Details Updated");
});

//API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getQuery = `
    SELECT 
    SUM(cases) AS totalCases,
    SUM(cured) AS  totalCured,
    SUM(active) AS  totalActive,
    SUM(deaths) AS  totalDeaths
    FROM
    district 
    WHERE state_id=${stateId};
    `;
  const dbResponse = await db.get(getQuery);
  response.send(dbResponse);
});

//API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const getDistrictIdQuery = `select state_id from district where district_id = ${districtId};`;

  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);
  //console.log(typeof getDistrictIdQueryResponse.state_id);

  const getStateNameQuery = `select state_name as stateName from state where 
  state_id = ${getDistrictIdQueryResponse.state_id}`;

  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
