from __future__ import annotations
import logging
from typing import Any

_LOGGER=logging.getLogger(__name__)
_UNKNOWN_TOKENS={"unknown","unavailable","none","null",""}

def _text(value: Any) -> str | None:
    if value is None: return None
    text=str(value).strip()
    return None if text.lower() in _UNKNOWN_TOKENS else text

def _number(value: Any) -> float | None:
    text=_text(value)
    if text is None: return None
    try: return float(text)
    except (TypeError,ValueError): return None

def _unit(unit: str | None) -> str:
    return (unit or "").strip().lower().replace(" ","")

def power_kw(value: Any, unit: str | None) -> float | None:
    n=_number(value); u=_unit(unit)
    if n is None: return None
    if u in {"w","watt","watts"}: return n/1000.0
    if u in {"mw","megawatt","megawatts"}: return n*1000.0
    return n if u in {"kw","kilowatt","kilowatts",""} else None

def energy_kwh(value: Any, unit: str | None) -> float | None:
    n=_number(value); u=_unit(unit)
    if n is None: return None
    if u in {"wh","watthour","watthours"}: return n/1000.0
    if u in {"mwh","megawatthour","megawatthours"}: return n*1000.0
    return n if u in {"kwh","kilowatthour","kilowatthours",""} else None

def current_a(value: Any, unit: str | None) -> float | None:
    n=_number(value); u=_unit(unit)
    if n is None: return None
    if u in {"ma","milliampere","milliamperes"}: return n/1000.0
    return n if u in {"a","amp","amps","ampere","amperes",""} else None

def distance_km(value: Any, unit: str | None) -> float | None:
    n=_number(value); u=_unit(unit)
    if n is None: return None
    if u in {"m","meter","meters"}: return n/1000.0
    if u in {"mi","mile","miles"}: return n*1.609344
    return n if u in {"km","kilometer","kilometers",""} else None

def percentage(value: Any, unit: str | None) -> float | None:
    n=_number(value); u=_unit(unit)
    if n is None: return None
    if u in {"%","percent","percentage",""} and 0 <= n <= 100: return n
    return None

def text(value: Any, unit: str | None = None) -> str | None:
    return _text(value)

def number(value: Any, unit: str | None = None) -> float | None:
    return _number(value)

_OCPP={
 "available":("idle","no_asset_connected"), "preparing":("preparing","asset_connected"),
 "charging":("running","asset_connected"), "suspendedev":("suspended","asset_connected"),
 "suspendedevse":("suspended","asset_connected"), "finishing":("stopped","asset_connected"),
 "faulted":("fault","fault"), "unavailable":("unknown","unknown"),
}
_PEBLAR={
 "no_ev_connected":("idle","no_asset_connected"), "suspended":("suspended","asset_connected"),
 "charging":("running","asset_connected"), "error":("fault","fault"), "fault":("fault","fault"),
 "invalid":("unknown","unknown"),
}
_WALLBOX={
 "charging":("running","asset_connected"), "suspended":("suspended","asset_connected"),
 "no_ev_connected":("idle","no_asset_connected"), "fault":("fault","fault"), "error":("fault","fault"),
}

def charger_state(integration_domain: str, value: Any) -> dict[str, str | None]:
    raw=_text(value)
    if raw is None: return {"charger.operating_state":None,"charger.connection_state":None}
    key=raw.strip().lower().replace(" ","") if integration_domain=="ocpp" else raw.strip().lower()
    table=_OCPP if integration_domain=="ocpp" else (_PEBLAR if integration_domain=="peblar" else _WALLBOX)
    pair=table.get(key)
    if pair is None:
        return {"charger.operating_state":"unknown","charger.connection_state":"unknown"}
    return {"charger.operating_state":pair[0],"charger.connection_state":pair[1]}

def utility_charger_state(integration_domain: str, value: Any) -> dict[str, str | None]:
    raw=_text(value)
    if raw is None: return {"charger.operating_state":None}
    key=raw.strip().lower()
    if key in {"on","charging","active","running"}: return {"charger.operating_state":"running"}
    if key in {"off","idle","inactive","stopped"}: return {"charger.operating_state":"idle"}
    if key in {"fault","error"}: return {"charger.operating_state":"fault"}
    return {"charger.operating_state":"unknown"}

def charger_connection(integration_domain: str, value: Any) -> dict[str, str | None]:
    raw=_text(value)
    if raw is None: return {"charger.connection_state":None}
    key=raw.strip().lower().replace(" ","_")
    if key in {"connected","asset_connected","plugged","plugged_in","occupied"}: return {"charger.connection_state":"asset_connected"}
    if key in {"disconnected","no_asset_connected","no_ev_connected","available"}: return {"charger.connection_state":"no_asset_connected"}
    if key in {"fault","faulted","error"}: return {"charger.connection_state":"fault"}
    return {"charger.connection_state":"unknown"}

def vehicle_charging_state(integration_domain: str, value: Any) -> dict[str, str | None]:
    raw=_text(value)
    if raw is None: return {"vehicle.charging_state":None}
    key=raw.strip().lower().replace(" ","_")
    if key in {"charging","active","running"}: state="charging"
    elif key in {"connected","plugged","plugged_in","external_power","preparing"}: state="connected"
    elif key in {"complete","completed","charged","finished","fully_charged"}: state="complete"
    elif key in {"not_charging","off","stopped","disconnected","inactive"}: state="not_charging"
    else: state="unknown"
    return {"vehicle.charging_state":state}

def person_presence(integration_domain: str, value: Any) -> dict[str, str | None]:
    raw=_text(value)
    if raw is None:
        return {'person.location_state':None,'person.presence_state':None}
    key=raw.strip().lower()
    if key=='home': presence='home'
    elif key=='not_home': presence='away'
    elif key in {'unknown','unavailable',''}: presence='unknown'
    else: presence='zone'
    return {'person.location_state':raw,'person.presence_state':presence}


def speed_kmh(value: Any, unit: str | None) -> float | None:
    n=_number(value); u=_unit(unit)
    if n is None: return None
    if u in {'m/s','mps','meterpersecond','meterspersecond'}: return n*3.6
    if u in {'mph','mi/h','mileperhour','milesperhour'}: return n*1.609344
    return n if u in {'km/h','kmh','kph','kilometerperhour','kilometersperhour',''} else None

def temperature_c(value: Any, unit: str | None) -> float | None:
    n=_number(value); u=_unit(unit)
    if n is None: return None
    if u in {'°f','f','fahrenheit'}: return (n-32.0)*5.0/9.0
    if u in {'k','kelvin'}: return n-273.15
    return n if u in {'°c','c','celsius',''} else None

def duration_min(value: Any, unit: str | None) -> float | None:
    n=_number(value); u=_unit(unit)
    if n is None: return None
    if u in {'s','sec','secs','second','seconds'}: return n/60.0
    if u in {'h','hr','hrs','hour','hours'}: return n*60.0
    return n if u in {'min','mins','minute','minutes',''} else None

def energy_price_per_kwh(value: Any, unit: str | None) -> float | None:
    n=_number(value); u=_unit(unit)
    if n is None: return None
    if u in {'ct/kwh','c/kwh','cent/kwh','cents/kwh','€ct/kwh'}: return n/100.0
    return n if u in {'eur/kwh','€/kwh','euro/kwh','euros/kwh',''} else None

def currency_value(value: Any, unit: str | None = None) -> float | None:
    return _number(value)

def phase_count(value: Any, unit: str | None = None) -> int | None:
    n=_number(value)
    if n is None: return None
    i=int(round(n))
    return i if 1 <= i <= 3 and abs(n-i) < 1e-9 else None

def integer_count(value: Any, unit: str | None = None) -> int | None:
    n=_number(value)
    if n is None or n < 0: return None
    i=int(round(n))
    return i if abs(n-i) < 1e-9 else None

def canonical_token(value: Any, unit: str | None = None) -> str | None:
    return _canon_token(value)

def moving_state(integration_domain: str, value: Any) -> dict[str,str | None]:
    key=_canon_token(value)
    if key is None:return {'value':None}
    if key in {'moving','on','true','driving','in_motion','active'}:return {'value':'moving'}
    if key in {'stationary','parked','off','false','stopped','idle','not_moving'}:return {'value':'stationary'}
    return {'value':'unknown'}

def connectivity_state(integration_domain: str, value: Any) -> dict[str,str | None]:
    key=_canon_token(value)
    if key is None:return {'value':None}
    if key in {'online','connected','available','ok','reachable','active'}:return {'value':'connected'}
    if key in {'offline','disconnected','unavailable','unreachable','inactive'}:return {'value':'disconnected'}
    if key in {'degraded','warning','stale'}:return {'value':'degraded'}
    return {'value':'unknown'}

def energy_flow_direction(value: Any, unit: str | None = None) -> str | None:
    key=_canon_token(value)
    if key is None:return None
    if key in {'import','charging','to_vehicle','to_connected_asset','grid_to_vehicle'}:return 'to_connected_asset'
    if key in {'export','discharging','from_vehicle','from_connected_asset','vehicle_to_grid'}:return 'from_connected_asset'
    if key in {'idle','none','stopped','zero'}:return 'idle'
    return 'unknown'

def electric_consumption_kwh_100km(value: Any, unit: str | None) -> float | None:
    n=_number(value); u=_unit(unit)
    if n is None:return None
    if u in {'wh/km','whperkm'}:return n/10.0
    if u in {'kwh/100km','kwhper100km',''}:return n
    return None

def fuel_consumption_l_100km(value: Any, unit: str | None) -> float | None:
    n=_number(value); u=_unit(unit)
    if n is None:return None
    if u in {'l/100km','lper100km','liter/100km','liters/100km',''}:return n
    return None

def normalize(rule: str, integration_domain: str, value: Any, unit: str | None) -> dict[str, Any]:
    if rule=="power_kw": return {"value":power_kw(value,unit)}
    if rule=="energy_kwh": return {"value":energy_kwh(value,unit)}
    if rule=="current_a": return {"value":current_a(value,unit)}
    if rule=="distance_km": return {"value":distance_km(value,unit)}
    if rule=="percentage": return {"value":percentage(value,unit)}
    if rule=="text": return {"value":text(value,unit)}
    if rule=="number": return {"value":number(value,unit)}
    if rule=="charger_state": return charger_state(integration_domain,value)
    if rule=="utility_charger_state": return utility_charger_state(integration_domain,value)
    if rule=="charger_connection": return charger_connection(integration_domain,value)
    if rule=="vehicle_charging_state": return vehicle_charging_state(integration_domain,value)
    if rule=="person_presence": return person_presence(integration_domain,value)
    if rule=="none": return {}
    if rule=="vehicle_security_state": return vehicle_security_state(integration_domain,value)
    if rule=="vehicle_climate_state": return vehicle_climate_state(integration_domain,value)
    if rule=="voltage_v": return {"value":voltage_v(value,unit)}
    if rule=="pressure_bar": return {"value":pressure_bar(value,unit)}
    if rule=="duration_s": return {"value":duration_s(value,unit)}
    if rule=="days": return {"value":days(value,unit)}
    if rule=="timestamp": return {"value":timestamp(value,unit)}
    if rule=="locked_state": return locked_state(integration_domain,value)
    if rule=="open_closed_state": return open_closed_state(integration_domain,value)
    if rule=="on_off_state": return on_off_state(integration_domain,value)
    if rule=="plug_state": return plug_state(integration_domain,value)
    if rule=="tire_health_state": return tire_health_state(integration_domain,value)
    if rule=="maintenance_state": return maintenance_state(integration_domain,value)
    if rule=="speed_kmh": return {"value":speed_kmh(value,unit)}
    if rule=="temperature_c": return {"value":temperature_c(value,unit)}
    if rule=="duration_min": return {"value":duration_min(value,unit)}
    if rule=="energy_price_per_kwh": return {"value":energy_price_per_kwh(value,unit)}
    if rule=="currency_value": return {"value":currency_value(value,unit)}
    if rule=="phase_count": return {"value":phase_count(value,unit)}
    if rule=="integer_count": return {"value":integer_count(value,unit)}
    if rule=="canonical_token": return {"value":canonical_token(value,unit)}
    if rule=="moving_state": return moving_state(integration_domain,value)
    if rule=="connectivity_state": return connectivity_state(integration_domain,value)
    if rule=="energy_flow_direction": return {"value":energy_flow_direction(value,unit)}
    if rule=="electric_consumption_kwh_100km": return {"value":electric_consumption_kwh_100km(value,unit)}
    if rule=="fuel_consumption_l_100km": return {"value":fuel_consumption_l_100km(value,unit)}
    raise ValueError(f"unknown Mobility normalizer: {rule}")

def vehicle_security_state(integration_domain: str, value: Any) -> dict[str, str | None]:
    raw=_text(value)
    if raw is None: return {'vehicle.security_state':None}
    key=raw.strip().lower().replace(' ','_')
    if key in {'locked','lock','secured','closed_locked','true','on'}: state='locked'
    elif key in {'unlocked','unlock','open','false','off'}: state='unlocked'
    else: state='unknown'
    return {'vehicle.security_state':state}

def vehicle_climate_state(integration_domain: str, value: Any) -> dict[str, str | None]:
    raw=_text(value)
    if raw is None: return {'vehicle.climate_state':None}
    key=raw.strip().lower().replace(' ','_')
    if key in {'on','active','running','heating','cooling','climatisation','climatization'}: state='on'
    elif key in {'off','inactive','stopped','disabled'}: state='off'
    else: state='unknown'
    return {'vehicle.climate_state':state}

def voltage_v(value: Any, unit: str | None) -> float | None:
    n=_number(value); u=_unit(unit)
    if n is None: return None
    if u in {'mv','millivolt','millivolts'}: return n/1000.0
    if u in {'kv','kilovolt','kilovolts'}: return n*1000.0
    return n if u in {'v','volt','volts',''} else None

def pressure_bar(value: Any, unit: str | None) -> float | None:
    n=_number(value); u=_unit(unit)
    if n is None: return None
    if u in {'bar',''}: return n
    if u in {'kpa'}: return n/100.0
    if u in {'pa'}: return n/100000.0
    if u in {'psi'}: return n*0.0689475729
    return None

def duration_s(value: Any, unit: str | None) -> float | None:
    n=_number(value); u=_unit(unit)
    if n is None: return None
    if u in {'s','sec','secs','second','seconds',''}: return n
    if u in {'min','mins','minute','minutes'}: return n*60.0
    if u in {'h','hr','hrs','hour','hours'}: return n*3600.0
    return None

def days(value: Any, unit: str | None) -> float | None:
    n=_number(value); u=_unit(unit)
    if n is None: return None
    if u in {'d','day','days',''}: return n
    if u in {'h','hr','hrs','hour','hours'}: return n/24.0
    return None

def timestamp(value: Any, unit: str | None = None) -> str | None:
    return _text(value)

def _canon_token(value: Any) -> str | None:
    raw=_text(value)
    return None if raw is None else raw.strip().lower().replace(' ','_').replace('-','_')

def locked_state(integration_domain: str, value: Any) -> dict[str,str | None]:
    key=_canon_token(value)
    if key is None:return {'value':None}
    if key in {'locked','secure','secured','true','on','closed_locked'}:return {'value':'locked'}
    if key in {'unlocked','false','off','open','open_unlocked'}:return {'value':'unlocked'}
    return {'value':'unknown'}

def open_closed_state(integration_domain: str, value: Any) -> dict[str,str | None]:
    key=_canon_token(value)
    if key is None:return {'value':None}
    if key in {'open','opened','ajar','true','on'}:return {'value':'open'}
    if key in {'closed','close','shut','false','off','locked'}:return {'value':'closed'}
    return {'value':'unknown'}

def on_off_state(integration_domain: str, value: Any) -> dict[str,str | None]:
    key=_canon_token(value)
    if key is None:return {'value':None}
    if key in {'on','active','running','enabled','heating'}:return {'value':'on'}
    if key in {'off','inactive','stopped','disabled'}:return {'value':'off'}
    return {'value':'unknown'}

def plug_state(integration_domain: str, value: Any) -> dict[str,str | None]:
    key=_canon_token(value)
    if key is None:return {'value':None}
    if key in {'connected','plugged','plugged_in','external_power','present','true','on'}:return {'value':'connected'}
    if key in {'disconnected','unplugged','not_connected','absent','false','off'}:return {'value':'disconnected'}
    return {'value':'unknown'}

def tire_health_state(integration_domain: str, value: Any) -> dict[str,str | None]:
    key=_canon_token(value)
    if key is None:return {'value':None}
    if key in {'ok','normal','good','green'}:return {'value':'ok'}
    if key in {'warning','warn','low','yellow'}:return {'value':'warning'}
    if key in {'critical','fault','error','red'}:return {'value':'critical'}
    return {'value':'unknown'}

def maintenance_state(integration_domain: str, value: Any) -> dict[str,str | None]:
    key=_canon_token(value)
    if key is None:return {'value':None}
    if key in {'ok','normal','not_due','good'}:return {'value':'ok'}
    if key in {'due','service_due','service_required','inspection_due'}:return {'value':'due'}
    if key in {'warning','warn'}:return {'value':'warning'}
    if key in {'critical','fault','error'}:return {'value':'critical'}
    return {'value':'unknown'}


_normalize_unchecked=normalize

def normalize(rule: str, integration_domain: str, value: Any, unit: str | None) -> dict[str, Any]:
    """Normalize one source value while containing source/adapter conversion faults.

    Unknown normalizer names remain programming/contract errors and fail closed. Runtime
    data conversion failures are isolated to this property so unrelated properties/assets
    keep refreshing; the caller will surface the empty result as unavailable/degraded truth.
    """
    try:
        return _normalize_unchecked(rule,integration_domain,value,unit)
    except ValueError as exc:
        if str(exc).startswith("unknown Mobility normalizer:"):
            raise
        _LOGGER.warning(
            "Mobility property normalization failed rule=%s integration=%s error=%s",
            rule,integration_domain,type(exc).__name__,
        )
        return {}
    except Exception as exc:
        _LOGGER.warning(
            "Mobility property normalization failed rule=%s integration=%s error=%s",
            rule,integration_domain,type(exc).__name__,
        )
        return {}
