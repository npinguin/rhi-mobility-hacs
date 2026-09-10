from __future__ import annotations
from copy import deepcopy
import voluptuous as vol
from homeassistant import config_entries
from .const import DOMAIN, NAME
from .domain_config import GUEST_VEHICLES_KEY, REVISION_KEY, MobilityDomainConfiguration, _guest_asset_id

class RhiMobilityConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1

    @staticmethod
    def async_get_options_flow(config_entry):
        return RhiMobilityOptionsFlow()

    async def async_step_user(self, user_input=None):
        if self._async_current_entries(): return self.async_abort(reason="single_instance_allowed")
        if user_input is not None: return self.async_create_entry(title=NAME, data={})
        return self.async_show_form(step_id="user", data_schema=vol.Schema({}))

class RhiMobilityOptionsFlow(getattr(config_entries, "OptionsFlow", object)):
    def __init__(self, config_entry=None) -> None:
        self._provided_config_entry=config_entry; self._target_guest=None
    def _entry(self):
        try: entry=self.config_entry
        except (AttributeError,ValueError): entry=None
        if entry is not None: return entry
        if self._provided_config_entry is not None: return self._provided_config_entry
        raise RuntimeError("Mobility options flow has no config entry")
    def _options(self): return deepcopy(dict(getattr(self._entry(),"options",{}) or {}))
    def _guests(self):
        rows=self._options().get(GUEST_VEHICLES_KEY,{})
        return deepcopy(rows) if isinstance(rows,dict) else {}
    def _charger_options(self):
        hass=getattr(self,"hass",None); data=getattr(hass,"data",{}).get(DOMAIN,{}) if hass is not None else {}
        runtime=(data.get(self._entry().entry_id) or {}).get("runtime"); rows={"":"No charger assigned"}
        for aid,asset in sorted(getattr(runtime,"assets",{}).items()):
            if getattr(asset,"concept_id",None)=="charger": rows[aid]=getattr(asset,"display_name",None) or aid
        return rows
    def _vehicle_schema(self,current=None):
        row=current or {}
        return vol.Schema({
            vol.Required("name",default=row.get("name","Guest vehicle")):str,
            vol.Required("profile_id",default=row.get("profile_id","guest_phev_1phase")):vol.In({"guest_phev_1phase":"Guest PHEV (1 phase)","guest_ev_3phase":"Guest EV (3 phase)"}),
            vol.Required("battery_capacity_kwh",default=row.get("battery_capacity_kwh",20.0)):vol.All(vol.Coerce(float),vol.Range(min=1,max=200)),
            vol.Required("soc_pct",default=row.get("soc_pct",50.0)):vol.All(vol.Coerce(float),vol.Range(min=0,max=100)),
            vol.Optional("battery_energy_kwh",default=row.get("battery_energy_kwh")):vol.Any(None,"",vol.All(vol.Coerce(float),vol.Range(min=0,max=200))),
            vol.Required("present",default=row.get("present",True)):bool,
            vol.Required("selected_charger",default=row.get("selected_charger") or ""):vol.In(self._charger_options()),
            vol.Required("lifecycle_status",default=row.get("lifecycle_status","active")):vol.In({"active":"Active","disabled":"Disabled"}),
        })
    def _validated_vehicle(self,user_input):
        values=dict(user_input); values["selected_charger"]=values.get("selected_charger") or None
        return MobilityDomainConfiguration._validate_guest_vehicle(values)
    def _result(self,guests):
        options=self._options(); options[GUEST_VEHICLES_KEY]=guests; options[REVISION_KEY]=int(options.get(REVISION_KEY,0) or 0)+1
        return self.async_create_entry(title="",data=options)
    async def async_step_init(self,user_input=None):
        choices=["add_guest_vehicle"]
        if self._guests(): choices.extend(["edit_guest_vehicle","remove_guest_vehicle"])
        return self.async_show_menu(step_id="init",menu_options=choices)
    async def async_step_add_guest_vehicle(self,user_input=None):
        if user_input is None: return self.async_show_form(step_id="add_guest_vehicle",data_schema=self._vehicle_schema())
        guests=self._guests(); values=self._validated_vehicle(user_input); aid=_guest_asset_id(values["name"],set(guests)); guests[aid]=values
        return self._result(guests)
    async def _select_guest(self,step_id,next_step,user_input=None):
        guests=self._guests()
        if user_input is not None:
            self._target_guest=str(user_input["guest_vehicle"]); return await getattr(self,f"async_step_{next_step}")()
        labels={aid:str(row.get("name") or aid) for aid,row in guests.items()}
        return self.async_show_form(step_id=step_id,data_schema=vol.Schema({vol.Required("guest_vehicle"):vol.In(labels)}))
    async def async_step_edit_guest_vehicle(self,user_input=None): return await self._select_guest("edit_guest_vehicle","edit_guest",user_input)
    async def async_step_edit_guest(self,user_input=None):
        guests=self._guests(); current=guests.get(str(self._target_guest),{})
        if user_input is None: return self.async_show_form(step_id="edit_guest",data_schema=self._vehicle_schema(current))
        guests[str(self._target_guest)]=self._validated_vehicle(user_input); return self._result(guests)
    async def async_step_remove_guest_vehicle(self,user_input=None): return await self._select_guest("remove_guest_vehicle","remove_guest",user_input)
    async def async_step_remove_guest(self,user_input=None):
        guests=self._guests(); target=str(self._target_guest)
        if user_input is None:
            return self.async_show_form(step_id="remove_guest",data_schema=vol.Schema({vol.Required("confirm",default=False):bool}),description_placeholders={"name":str(guests.get(target,{}).get("name") or target)})
        if not user_input.get("confirm"): return await self.async_step_init()
        guests.pop(target,None); options=self._options(); semantic=dict(options.get("domain_semantic_configuration",{}) or {}); semantic.pop(target,None)
        options["domain_semantic_configuration"]=semantic; options[GUEST_VEHICLES_KEY]=guests; options[REVISION_KEY]=int(options.get(REVISION_KEY,0) or 0)+1
        return self.async_create_entry(title="",data=options)
