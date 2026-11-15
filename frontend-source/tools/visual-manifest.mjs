import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

export function buildMobilityVisualManifest(root, version) {
  const src=fs.readFileSync(path.join(root,"src/app/asset-catalog.js"),"utf8");
  const context={Object,Array,String,console,rhiMobilityAssetUrl:(p)=>p};
  vm.createContext(context);
  vm.runInContext(src,context);
  const vehicles=vm.runInContext("rhiMobilityVehicleVisualCatalog()",context);
  const chargers=vm.runInContext("rhiMobilityChargerVisualCatalog()",context);
  const refs=[];
  for(const vehicle of vehicles){
    for(const color of vehicle.colors||[]){
      refs.push({
        visual_ref:`mobility.vehicle.${vehicle.id}.${color.id}`,
        kind:"vehicle",brand:vehicle.brand,model:vehicle.model,variant:vehicle.variant||"",
        appearance:color.id,image_key:vehicle.image_key,package_path:vehicle.package_file,
        quality:vehicle.visual_quality||""
      });
    }
  }
  for(const charger of chargers){
    for(const appearance of charger.appearances||[]){
      refs.push({
        visual_ref:`mobility.charger.${charger.id}.${appearance.id}`,
        kind:"charger",brand:charger.brand,model:charger.model,variant:charger.variant||"",
        appearance:appearance.id,image_key:appearance.image_key,package_path:appearance.package_file,
        quality:charger.visual_quality||""
      });
    }
  }
  refs.push({visual_ref:"mobility.vehicle.generic.fallback",kind:"vehicle",image_key:"vehicle_fallback",package_path:"vehicles/vehicle_fallback.png",quality:"generic_fallback"});
  refs.push({visual_ref:"mobility.charger.generic.fallback",kind:"charger",image_key:"charger_fallback",package_path:"chargers/charger_fallback.png",quality:"generic_fallback"});
  refs.sort((a,b)=>a.visual_ref.localeCompare(b.visual_ref));
  return {schema_version:1,product:"rhi_mobility",version,authority:"mobility_visual_catalog",refs};
}
