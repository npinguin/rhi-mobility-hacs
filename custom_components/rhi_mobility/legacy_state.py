from __future__ import annotations
import json
from pathlib import Path
from typing import Any
from .const import RELEASE, RELEASE_NAME

CONTRACT='MOBILITY_PUBLIC_RUNTIME_V1'

class MobilityLegacyV1StatePublisher:
    """Exact R43.2.65 public state facade backed exclusively by the V2 providers.

    These states deliberately bypass EntityPlatform naming so exact historical entity IDs are
    retained. Setup fails when an active legacy state still exists; V2 never overwrites a live V1
    computation and never accepts an `_2` compatibility suffix.
    """
    def __init__(self,hass,facade,manager,controller) -> None:
        self.hass=hass; self.facade=facade; self.manager=manager; self.controller=controller
        shape_path=Path(__file__).parent/'contracts'/'runtime'/'legacy_public_entity_shapes_v1.json'
        self.shapes=json.loads(shape_path.read_text(encoding='utf-8'))['entities']
        self._unsubs=[]; self._started=False

    def collision_ids(self) -> list[str]:
        return sorted(eid for eid in self.facade.required_entity_ids if self.hass.states.get(eid) is not None)

    def start(self) -> None:
        collisions=self.collision_ids()
        if collisions:
            raise RuntimeError('legacy Mobility facade collision; disable R43.2.65 before V2 takeover: '+','.join(collisions))
        self._started=True
        subscribe=getattr(self.manager,'add_runtime_listener',self.manager.add_listener)
        self._unsubs=[subscribe(self.publish),self.controller.add_listener(self.publish)]
        self.publish()

    def stop(self) -> None:
        for unsub in self._unsubs: unsub()
        self._unsubs=[]
        if self._started:
            for eid in self.facade.required_entity_ids: self.hass.states.async_remove(eid)
        self._started=False

    @staticmethod
    def _default(key: str):
        if key.endswith('_json') or key in {'commands','properties','profiles','consumer_assets','connection_assets','charging_relations','directional_connection_counters'}: return []
        if key.endswith('_by_key') or key.endswith('_by_id') or key.endswith('_by_asset') or key.endswith('_by_component') or key in {'activities_by_scope','transactions_by_scope','last_results_by_scope','supervisory_by_key'}: return {}
        if key.endswith('_count') or key.startswith('total_') or key in {'consumer_count','connection_count','active_consumer_count','property_count','component_count','definition_count','internal_alias_count','open_activity_count'}: return 0
        return None

    def _shaped(self,eid: str,attrs: dict[str,Any]) -> dict[str,Any]:
        expected=self.shapes[eid]['attribute_keys']
        return {k:attrs.get(k,self._default(k)) for k in expected}

    def _component_entity(self,component: str) -> str:
        return f'sensor.mobility_vehicle_{component}_property_index'

    def _property_router(self,component: str|None=None):
        rows=self.facade.property_rows('vehicle',component)
        by=self.facade.by_key(rows)
        if component:
            return rows,by
        comps=['identity','battery','charging','range','access','comfort','location','maintenance','diagnostics']
        counts={c:len(self.facade.property_rows('vehicle',c)) for c in comps}
        return rows,by,counts

    def _person_rows(self):
        rows=[]
        for aid,a in sorted(self.manager.assets.items()):
            if a.concept_id!='person': continue
            snap=self.manager.snapshots.get(aid); vals={} if snap is None else snap.values
            for key,label in (('person.location_state','Location state'),('person.presence_state','Presence')):
                value=vals.get(key)
                rows.append({'asset_id':aid,'asset_type':'person','property_key':key,'value':value,'display_value':value,'friendly_name':label,'editable':False,'available':value is not None,'source_layer':'rhi_mobility_v2'})
        return rows

    def _physical_proven(self) -> bool:
        for row in self.controller.executor.snapshot().get('last_results',[]):
            if row.get('result') in {'SUCCEEDED','SUCCEEDED_AFTER_DELAY','ALREADY_CONVERGED'} and row.get('write_attempted'):
                return True
        return False

    @staticmethod
    def _contains_not_evaluated(value: Any) -> bool:
        if isinstance(value, str):
            return value.strip().lower() == 'not_evaluated'
        if isinstance(value, dict):
            return any(MobilityLegacyV1StatePublisher._contains_not_evaluated(v) for v in value.values())
        if isinstance(value, (list, tuple)):
            return any(MobilityLegacyV1StatePublisher._contains_not_evaluated(v) for v in value)
        return False

    def _intelligence_violations(self) -> list[str]:
        violations: list[str] = []
        vehicles = self.facade.experience_rows('vehicle')
        chargers = self.facade.experience_rows('charger')
        required_vehicle = {
            'readiness_intelligence','range_intelligence','energy_intelligence',
            'charging_intelligence','security_intelligence','comfort_intelligence',
            'maintenance_intelligence',
        }
        required_charger = {
            'availability_intelligence','connection_intelligence','vehicle_intelligence',
            'charging_intelligence','power_intelligence','current_intelligence',
            'maintenance_intelligence','freshness_intelligence',
        }
        for row in vehicles:
            aid = str(row.get('asset_id','unknown'))
            for key in sorted(required_vehicle - set(row)):
                violations.append(f'{aid}:missing:{key}')
            maint = row.get('maintenance_intelligence', {})
            for key in ('oil_service','general_inspection','tire_health'):
                if key not in maint:
                    violations.append(f'{aid}:maintenance_missing:{key}')
            if self._contains_not_evaluated(row):
                violations.append(f'{aid}:not_evaluated_forbidden')
        for row in chargers:
            aid = str(row.get('asset_id','unknown'))
            for key in sorted(required_charger - set(row)):
                violations.append(f'{aid}:missing:{key}')
            if not isinstance(row.get('vehicle_intelligence'), dict):
                violations.append(f'{aid}:vehicle_context_missing')
            if self._contains_not_evaluated(row):
                violations.append(f'{aid}:not_evaluated_forbidden')
        expected_v = sum(a.concept_id=='vehicle' for a in self.manager.assets.values())
        expected_c = sum(a.concept_id=='charger' for a in self.manager.assets.values())
        if len(vehicles) != expected_v:
            violations.append(f'vehicle_count:{len(vehicles)}:expected:{expected_v}')
        if len(chargers) != expected_c:
            violations.append(f'charger_count:{len(chargers)}:expected:{expected_c}')
        return violations

    def _payload(self,eid: str) -> tuple[Any,dict[str,Any]]:
        assets=self.facade.assets(); relationships=self.facade.relationship_rows(); commands=self.facade.command_rows()
        release={'contract_version':CONTRACT,'release_version':RELEASE,'release_name':RELEASE_NAME,'contract_name':'Mobility Public Runtime Contract'}
        if eid=='sensor.mobility_release_identity':
            attrs={**release,'distribution_file':f'RHI_Mobility_V2_{RELEASE}.zip','runtime_status':'RUNTIME_NOT_PROVEN'}
            return RELEASE,self._shaped(eid,attrs)
        if eid=='sensor.mobility_release_contract':
            public_contracts=[
                'sensor.mobility_release_contract','sensor.mobility_asset_index','sensor.mobility_vehicle_profile_index',
                'sensor.mobility_charger_profile_index','sensor.mobility_product_profile_index','sensor.mobility_effective_charging_capability_index',
                'sensor.mobility_vehicle_property_index','sensor.mobility_vehicle_component_contract_index','sensor.mobility_charger_property_index',
                'sensor.mobility_charger_component_contract_index','sensor.mobility_person_property_index','sensor.mobility_relationship_index',
                'sensor.mobility_command_index','sensor.mobility_activity_index','sensor.mobility_vehicle_command_slot_index',
                'sensor.mobility_charger_command_slot_index','sensor.mobility_vehicle_intelligence_index','sensor.mobility_charger_intelligence_index',
                'sensor.mobility_ux_runtime_consumption_map','sensor.mobility_energy_asset_publication','sensor.mobility_energy_contract_registry',
                'sensor.mobility_energy_publication_health','sensor.mobility_canonical_asset_contract_registry',
            ]
            attrs={
                'backend_release':RELEASE,'release_title':RELEASE_NAME,'contract_version':CONTRACT,
                'contract_name':'Mobility Public Runtime Contract','schema_version':'typed_public_owner_contracts_v1','contract_health':'OK',
                'compatibility_rule':'R43.2.65 public contract is preserved by an exact V1 facade over the V2 runtime; no legacy computation is active.',
                'public_contracts_json':json.dumps(public_contracts,separators=(',',':')),'deprecated_contracts_json':'[]',
                'internal_only_contracts_json':json.dumps(['candidate_registries','binding_adapter_registries','normalized_property_registries','fact_registries','source_evidence_registries'],separators=(',',':')),
                'ownership_rule':'One public owner per concern. UX joins identity, property, relationship, command, activity and layout contracts by stable IDs; Energy consumes only the Energy boundary.',
                'deprecation_rule':'Legacy computation is retired; the V1 facade is a projection only and may be removed only after UX/domain consumers migrate.',
                'governance_rule':'Model first -> source -> build -> package -> distribution. UX and other domains consume public contracts only.',
            }
            return 'OK',self._shaped(eid,attrs)
        if eid=='sensor.mobility_energy_contract_registry':
            attrs={
                'contract_version':CONTRACT,'registry_type':'external_energy_asset_publication_contract_v1','consumer_visibility':'public_contract',
                'publication_role':'mobility_produced_external_energy_asset_publication_for_energy',
                'domain_boundary_rule':'Energy owns canonical Energy semantics/planning. Mobility owns Mobility truth and physical command execution.',
                'republish_trigger_rule':'V2 publishes change-only semantic snapshots from canonical Mobility runtime and relationships.',
                'schema_version':'external_energy_asset_publication_v1','publication_entity':'sensor.mobility_energy_asset_publication',
                'asset_scope_json':json.dumps(['vehicle_charging_consumers','charger_connection_metering_assets'],separators=(',',':')),
                'forbidden_publication_json':json.dumps(['charger_command_bodies','vehicle_command_bodies','raw_candidate_registries','raw_relationship_internals','physical_service_bindings'],separators=(',',':')),
                'required_consumer_fields_json':json.dumps(['asset_id','display_name','source_domain','source_asset_kind','energy_asset_role','cluster_role','lifecycle_status','availability_state','energy_control_mode','energy_control_hold_state','connection_state','assigned_connection_id','effective_connection_id','physical_connection_id','operating_state','power_kw','energy_flow_direction','energy_to_target_kwh','energy_need_resolution_state','planning_input_ready','limits','readiness','capabilities','automation','command_refs','source_context','health'],separators=(',',':')),
                'required_connection_fields_json':json.dumps(['asset_id','display_name','source_domain','source_asset_kind','energy_asset_role','cluster_role','lifecycle_status','availability_state','energy_control_mode','energy_control_hold_state','connection_state','connected_asset_id','operating_state','power_kw','energy_flow_direction','limits','metering','capabilities','automation','command_refs','source_context','health'],separators=(',',':')),
                'active_rule':'active means enabled/configured for Energy publication; temporary availability never becomes lifecycle disabled.',
                'limit_rule':'Consumer limits are the resolved vehicle-on-effective-charger envelope; physical charger limits remain Mobility-owned.',
                'semantic_publication_rule':'Energy-facing facts are canonical/domain-neutral; power_kw is a non-negative magnitude and direction is separate.',
                'r41_83_minimal_contract_marker':'typed_generic_flexible_energy_only','direction_rule':'power_kw is magnitude; energy_flow_direction is import/export/idle/unknown.',
                'policy_rule':'energy_control_mode is automatic/manual/disabled; paused is a hold state; disabled is explicit opt-out only.',
                'minimal_tech_debt_rule':'V1 shape is projected directly from V2; no duplicate Energy computation exists.','legacy_field_policy':'compatibility_facade_only',
                'availability_projection_rule':'Availability is executable runtime readiness, not lifecycle.','canonical_energy_contract':'Canonical Energy Asset Runtime Contract v1',
                'model_first_rule':'Model first -> source -> build -> package -> distribution.',
                'required_core_fields_json':json.dumps(['asset_id','display_name','source_domain','source_asset_kind','energy_asset_role','cluster_role','lifecycle_status','lifecycle_reason','availability_state','availability_reason','operating_state','power_kw','energy_flow_direction','health','health_reason'],separators=(',',':')),
                'required_controllable_fields_json':json.dumps(['energy_control_mode','energy_control_hold_state','limits','capabilities','automation'],separators=(',',':')),
                'required_flexible_load_fields_json':json.dumps(['connection_state','assigned_connection_id','effective_connection_id','physical_connection_id','capacity_kwh','soc_pct','target_soc_pct','stored_energy_kwh','target_energy_kwh','energy_to_target_kwh','energy_need_resolution_state','planning_input_ready','profile_id','effective_profile_id','profile_resolution_state','capacity_source','readiness'],separators=(',',':')),
                'required_connection_point_fields_json':json.dumps(['connection_state','connected_asset_id','limits','metering','capabilities'],separators=(',',':')),
                'forbidden_canonical_fields_json':json.dumps(['raw_service_binding','raw_candidate_registry','raw_integration_status_as_truth'],separators=(',',':')),
                'power_flow_rule':'power_kw is always a non-negative magnitude; energy_flow_direction carries direction.',
                'lifecycle_rule':'lifecycle_status comes only from lifecycle configuration/policy; availability/presence do not redefine lifecycle.',
                'source_context_rule':'Producer-specific evidence may be diagnostics only; Energy planning consumes canonical fields.',
                'canonical_cutover_rule':'sensor.mobility_energy_asset_publication remains the V1 external boundary while V2 is sole computation authority.',
                'command_reference_rule':'Energy receives command references/readiness only; command bodies and physical routing remain Mobility-owned.',
                'canonical_charger_runtime_projection_rule':'OCPP/Peblar/Wallbox/utility facts normalize once in V2 before UX/Energy projection.',
                'ocpp_power_fallback_rule':'No UX/Energy fallback inference; Mobility adapter/runtime owns any approved source-specific normalization.',
                'peblar_projection_rule':'Peblar facts normalize to the same canonical fields as other chargers.',
                'utility_projection_rule':'Utility charging surfaces normalize to canonical power/state; unknown never silently allows automation.',
                'device_recovery_rule':'Temporary unavailable/recovery degrades execution without deleting assignment/binding.',
                'recovery_snapshot_rule':'Recovery requires current coherent readback; stale connected truth is never reused.',
                'utility_plug_profile_binding_rule':'Utility surface capability is explicit and does not gain unsupported current-limit semantics.',
                'energy_command_resolution_rule':'Energy requests intent through Mobility command contract; Mobility owns readiness and execution.',
                'persistent_user_setting_rule':'User semantic configuration persists in Mobility config; startup never replays physical commands.',
                'requested_power_current_correlation_rule':'requested kW and requested current reconcile only with explicit voltage/phase control profile; readback remains actual.',
                'lifecycle_participation_rule':'disabled is explicit lifecycle opt-out; away/disconnected are not disabled.',
                'original_energy_requested_power_rule':'Energy may request power intent but does not own the physical setpoint or write lifecycle.',
                'mobility_energy_authority_rule':'Mobility is authoritative for vehicle/charger facts, relationships and physical execution.',
                'requested_power_external_write_contract_rule':'External requested-power writes enter Mobility; actual value remains authoritative physical readback.',
                'connection_editor_link_rule':'Configured assignment is Mobility semantic configuration; physical connection is separate evidence.',
                'start_stop_command_integrity_rule':'START/STOP references resolve to canonical Mobility commands; STOP retains protective idempotency.',
            }
            return 'ready',self._shaped(eid,attrs)
        if eid=='sensor.mobility_energy_publication_health':
            e=self.facade.energy_v1(); consumers=e['consumer_assets']; connections=e['connection_assets']
            active=sum(1 for x in consumers if x.get('lifecycle_status')=='active')
            expected_consumers=sum(a.concept_id=='vehicle' for a in self.manager.assets.values())
            expected_connections=sum(a.concept_id=='charger' for a in self.manager.assets.values())
            violations=[]
            if len(consumers)!=expected_consumers: violations.append('consumer_count_mismatch')
            if len(connections)!=expected_connections: violations.append('connection_count_mismatch')
            attrs={
                'contract_version':CONTRACT,'consumer_count':len(consumers),'expected_consumer_count':expected_consumers,
                'active_consumer_count':active,'expected_active_consumer_count':'dynamic_lifecycle_configured','connection_count':len(connections),
                'expected_connection_count':expected_connections,'total_energy_asset_count':len(consumers)+len(connections),
                'expected_total_energy_asset_count':expected_consumers+expected_connections,'relationship_republish_dependency':'sensor.mobility_relationship_index',
                'semantic_violations_json':json.dumps(violations,separators=(',',':')),
                'release_gate':'FAIL on schema/ownership/count/semantic violations; runtime hardware proof remains a separate acceptance gate.',
                'minimal_tech_debt_rule':'V1 Energy contract is a V2 projection only.','legacy_field_policy':'compatibility_facade_only',
                'schema_version':'external_energy_asset_publication_v1','canonical_field_policy':'Canonical facts only; physical bindings remain private.',
                'charger_runtime_projection_gate':'FAIL if canonical charger power/state/readback are missing despite valid source evidence.',
                'canonical_cutover_gate':'PASS when V2 is sole computation authority and legacy entity IDs are facade-only.',
                'command_reference_gate':'FAIL when an Energy command reference is absent from sensor.mobility_command_index.',
                'execution_boundary_gate':'FAIL if Energy is required to reconstruct physical execution routing/readiness.',
                'persistent_setting_gate':'FAIL if startup can overwrite/replay user semantic settings or physical commands.',
            }
            return ('OK' if not violations else 'FAIL'),self._shaped(eid,attrs)
        if eid=='sensor.mobility_canonical_asset_contract_registry':
            fields=['asset_id','display_name','source_domain','source_asset_kind','energy_asset_role','cluster_role','lifecycle_status','lifecycle_reason','availability_state','availability_reason','energy_control_mode','energy_control_hold_state','connection_state','assigned_connection_id','effective_connection_id','physical_connection_id','connected_asset_id','operating_state','power_kw','energy_flow_direction','stored_energy_kwh','target_energy_kwh','energy_to_target_kwh','available_export_energy_kwh','capacity_kwh','soc_pct','target_soc_pct','limits','capabilities','automation','metering','health','health_reason']
            attrs={'contract_version':CONTRACT,'consumer_visibility':'public_contract','contract_name':'Mobility Canonical Asset Runtime Contract','aligned_energy_contract':'Canonical Energy Asset Runtime Contract v1','external_publication_contract':'External Energy Asset Publication Contract v1','governance_rule':'Model first -> source -> build -> package -> distribution.','shared_canonical_fields_json':json.dumps(fields,separators=(',',':')),'lifecycle_enum_json':json.dumps(['active','inactive','disabled','commissioning','retired','unknown'],separators=(',',':')),'availability_enum_json':json.dumps(['available','unavailable','degraded','unknown'],separators=(',',':')),'energy_control_mode_enum_json':json.dumps(['automatic','manual','disabled'],separators=(',',':')),'energy_control_hold_state_enum_json':json.dumps(['none','paused'],separators=(',',':')),'energy_flow_direction_enum_json':json.dumps(['import','export','idle','unknown'],separators=(',',':')),'no_guess_rule':'UX and Energy consume canonical fields/contracts and never infer raw source semantics.'}
            return 'ready',self._shaped(eid,attrs)
        if eid=='sensor.mobility_runtime_health':
            state=('OK' if self.manager.last_build_attempt.get('status')=='REMOVED' else 'WAITING_FOR_FOUNDATION') if not self.manager.snapshots else ('OK' if all(s.health=='OK' for s in self.manager.snapshots.values()) else 'DEGRADED')
            attrs={**release,'health_scope':'v2_runtime_backed_v1_facade','health_rule':'Earliest V2 runtime failure is authoritative; no compatibility false-green.','missing_entities_json':[],'violations_json':[]}
            return state,self._shaped(eid,attrs)
        if eid=='sensor.mobility_release_acceptance_health':
            runtime=('OK' if self.manager.last_build_attempt.get('status')=='REMOVED' else 'WAITING_FOR_FOUNDATION') if not self.manager.snapshots else ('OK' if all(s.health=='OK' for s in self.manager.snapshots.values()) else 'DEGRADED')
            physical='PROVEN' if self._physical_proven() else 'NOT_PROVEN'
            state='ACCEPTED' if runtime=='OK' and physical=='PROVEN' else ('FAIL' if runtime=='FAIL' else 'NOT_PROVEN')
            return state,self._shaped(eid,{**release,'health_scope':'release_acceptance_requires_runtime_and_physical_proof','runtime_health':runtime,'physical_acceptance':physical,'acceptance_rule':'ACCEPTED only after runtime is OK and bounded physical execution is proven.'})
        if eid=='sensor.mobility_asset_index':
            return 'ready',self._shaped(eid,{'contract_version':CONTRACT,'index_schema':'mobility_asset_index_v1_compatible','consumer_visibility':'public_contract','index_role':'identity_navigation','ownership':'rhi_mobility_v2','forbidden_contents':['raw_service_bindings'],'assets_json':assets,'image_identity_rule':'profile/image key only'})
        if eid=='sensor.mobility_vehicle_property_index':
            rows,by,counts=self._property_router()
            comps={c:self._component_entity(c) for c in counts}
            return 'ready',self._shaped(eid,{'contract_version':CONTRACT,'index_schema':'vehicle_property_index_v1','asset_type':'vehicle','consumer_visibility':'public_contract','materialization_rule':'exact_v1_property_catalog_from_v2','component_split_rule':'MODEL component ownership','dependency_rule':'V2 snapshots/config only','component_indexes_json':list(comps.values()),'component_indexes_by_component':comps,'properties':rows,'properties_by_key':by,'component_property_counts_json':counts,'structural_health':'OK','definition_owner':'R43.2.65 compatibility catalog','component_contract_entity':'sensor.mobility_vehicle_component_contract_index'})
        component_by_eid={f'sensor.mobility_vehicle_{c}_property_index':c for c in ['identity','battery','charging','range','access','comfort','location','maintenance','diagnostics']}
        if eid in component_by_eid:
            c=component_by_eid[eid]; rows,by=self._property_router(c)
            return 'ready',self._shaped(eid,{'contract_version':CONTRACT,'index_schema':'vehicle_component_property_index_v1','asset_type':'vehicle','component':c,'consumer_visibility':'public_contract','materialization_rule':'exact_v1_property_catalog_from_v2','dependency_rule':'V2 snapshot/config','properties':rows,'properties_by_key':by,'property_count':len(rows),'payload_guardrail':'change_only_facade','definition_owner':'R43.2.65 compatibility catalog','placement_projection':'vehicle component contract'})
        if eid=='sensor.mobility_charger_property_index':
            rows=self.facade.property_rows('charger'); by=self.facade.by_key(rows)
            return 'ready',self._shaped(eid,{'contract_version':CONTRACT,'index_schema':'charger_property_index_v1','asset_type':'charger','consumer_visibility':'public_contract','ownership':'rhi_mobility_v2','definition_owner':'R43.2.65 compatibility catalog','placement_projection':'charger component contract','module_entities_json':[],'raw_properties':rows,'properties':rows,'properties_by_key':by,'unmapped_properties_json':[],'structural_health':'OK','placement_rule':'exact property key/component placement'})
        if eid=='sensor.mobility_person_property_index':
            rows=self._person_rows(); by=self.facade.by_key(rows)
            return 'ready',self._shaped(eid,{'contract_version':CONTRACT,'index_schema':'person_property_index_v1','asset_type':'person','consumer_visibility':'public_contract','materialization_rule':'V2 person presence builder','properties':rows,'properties_by_key':by})
        if eid=='sensor.mobility_relationship_index':
            by={}
            for r in relationships:
                by.setdefault(r['from_asset_id'],[]).append(r); by.setdefault(r['to_asset_id'],[]).append(r)
            return 'ready',self._shaped(eid,{'contract_version':CONTRACT,'index_schema':'relationship_index_v1','consumer_visibility':'public_contract','relationship_policy':'configured assignment explicit; physical connection not inferred','relationships':relationships,'relationships_by_asset':by,'assignments_json':relationships,'assignment_rule':'Mobility semantic configuration'})
        if eid=='sensor.mobility_command_index':
            return 'ready',self._shaped(eid,{'contract_version':CONTRACT,'index_schema':'command_index_v1','consumer_visibility':'public_contract','authority_rule':'V2 command controller is sole readiness authority','binding_source_rule':'accepted Mobility source bindings only','execution_rule':'script.mobility_execute_command -> V2 executor','stop_rule':'protective idempotent STOP preserved','commands':commands})
        if eid=='sensor.mobility_activity_index':
            activities=self.facade.activity.snapshot().get('activities',[])
            by={}
            for a in activities: by.setdefault(a.get('asset_id','unknown'),[]).append(a)
            return len(activities),self._shaped(eid,{'contract_version':CONTRACT,'consumer_visibility':'public_contract','index_schema':'activity_index_v1','index_role':'latest/current activity','standard_rule':'HA Recorder owns long-term history','long_term_history_rule':'recorder','open_activity_count':0,'activities_by_scope':by,'activities_json':activities,'transactions_by_scope':{},'last_results_by_scope':{},'snapshot_revision':max((s.build_input_revision for s in self.manager.snapshots.values()),default=0),'observed_at':None})
        if eid in {'sensor.mobility_vehicle_component_contract_index','sensor.mobility_charger_component_contract_index'}:
            typ='vehicle' if 'vehicle_' in eid else 'charger'; c=self.facade.component_contract(typ)
            attrs={'contract_version':CONTRACT,'index_schema':f'{typ}_component_contract_v1','asset_type':typ,'consumer_visibility':'public_contract','governance_rule':'exact R43.2.65 placement projected from V2','model_source':'legacy compatibility catalog','source_implementation':'rhi_mobility V2 facade','definition_hash':'M0.5.8','definition_count':len(self.facade.defs_by_type[typ]),'internal_alias_count':len(self.facade.aliases),'component_count':c['component_count'],'property_index_entity':f'sensor.mobility_{typ}_property_index','relationship_index_entity':'sensor.mobility_relationship_index','activity_index_entity':'sensor.mobility_activity_index','command_index_entity':'sensor.mobility_command_index','command_slot_index_entity':f'sensor.mobility_{typ}_command_slot_index','property_component_map_json':c['property_component_map_json'],'ux_fields_by_property_json':c['property_component_map_json'],'components_json':c['components_json'],'components_by_id':c['components_by_id'],'ux_cards_json':c['components_json'],'ux_layout_rules_json':[],'ux_forbidden_rendering_json':[],'command_render_rule':'render slot placement exactly once','required_ux_contract_fields_json':['property_key','component_id','section_id']}
            if typ=='vehicle': attrs.update({'entity_id':eid,'router_entity':'sensor.mobility_vehicle_property_index','router_rule':'component indexes own placement','component_materialization_rule':'exact property catalog','engineering_rule':'engineering only when declared','required_component_indexes_json':[self._component_entity(x) for x in ['identity','battery','charging','range','access','comfort','location','maintenance','diagnostics']]})
            return 'ready',self._shaped(eid,attrs)
        if eid in {'sensor.mobility_vehicle_command_slot_index','sensor.mobility_charger_command_slot_index'}:
            typ='vehicle' if 'vehicle_' in eid else 'charger'; slots=self.facade.command_slots(typ); by={x['asset_id']:x for x in slots}
            attrs={'contract_version':CONTRACT,'release_version':RELEASE,'consumer_visibility':'public_contract','index_schema':f'{typ}_command_slot_index_v1','command_index_entity':'sensor.mobility_command_index','authority_rule':'placement only; readiness from command index','execution_rule':'UX calls script.mobility_execute_command','family_section_rule':'R43.2.65 family placement','lifecycle_rule':'lifecycle_status is editable control','availability_command_rule':'availability command not exposed','placement_rule':'every supported frontend command once','slots_json':slots,'slots_by_asset':by,'placement_violations_json':[]}
            return 'ready',self._shaped(eid,attrs)
        if eid in {'sensor.mobility_vehicle_intelligence_index','sensor.mobility_charger_intelligence_index'}:
            typ='vehicle' if 'vehicle_' in eid else 'charger'; rows=self.facade.experience_rows(typ); by={x['asset_id']:x for x in rows}
            attrs={'contract_version':CONTRACT,'index_schema':f'{typ}_intelligence_v1','asset_type':typ,'consumer_visibility':'public_contract','intelligence_role':'backend_owned_summary','property_lineage_rule':'canonical V2 properties only','vehicle_context_rule':'configured relationship only','freshness_rule':'freshness is not maintenance','no_write_rule':'intelligence never writes','completeness_rule':'missing evidence -> unknown','assets_json':rows,'assets_by_id':by,'intelligence_keys_json':sorted({k for r in rows for k in r if k!='asset_id'})}
            return 'ready',self._shaped(eid,attrs)
        if eid=='sensor.mobility_intelligence_index':
            v=self.facade.experience_rows('vehicle'); c=self.facade.experience_rows('charger'); sup=self.facade.supervisory()
            return 'ready',self._shaped(eid,{'contract_version':CONTRACT,'index_schema':'mobility_intelligence_v1','consumer_visibility':'public_contract','intelligence_role':'backend_owned_summary','property_lineage_rule':'V2 canonical facts','presentation_boundary_rule':'UX renders; does not infer','no_write_rule':'true','clusters_json':v+c,'clusters_by_asset_type':{'vehicle':v,'charger':c},'supervisory_by_key':sup,'supervisory_keys_json':list(sup),'supervisory_rule':'Energy planning remains Energy-owned'})
        if eid=='sensor.mobility_ux_runtime_consumption_map':
            entrypoints=self.facade.required_entity_ids
            attrs={'contract_version':CONTRACT,'consumer_visibility':'public_contract','index_schema':'ux_runtime_consumption_map_v1','governance_rule':'old UX may remain unchanged','identity_navigation_contract':'sensor.mobility_asset_index','vehicle_property_router_contract':'sensor.mobility_vehicle_property_index','charger_property_contract':'sensor.mobility_charger_property_index','person_property_contract':'sensor.mobility_person_property_index','relationship_contract':'sensor.mobility_relationship_index','command_readiness_contract':'sensor.mobility_command_index','command_result_contract':'sensor.mobility_activity_index','vehicle_layout_contract':'sensor.mobility_vehicle_component_contract_index','charger_layout_contract':'sensor.mobility_charger_component_contract_index','vehicle_command_placement_contract':'sensor.mobility_vehicle_command_slot_index','charger_command_placement_contract':'sensor.mobility_charger_command_slot_index','vehicle_intelligence_contract':'sensor.mobility_vehicle_intelligence_index','charger_intelligence_contract':'sensor.mobility_charger_intelligence_index','runtime_entry_points_json':entrypoints,'deprecated_compatibility_sources_json':[],'forbidden_new_ux_sources_json':['raw integrations','rhi_mobility internal bindings'],'join_rule':'stable asset_id/property_key/command_id joins','property_rule':'use published property rows','charger_operational_status_rule':'charger.operating_state only','charger_connection_status_rule':'charger.connection_state only','charger_status_fallback_rule':'forbidden','relationship_rule':'relationship index only','command_rule':'slot placement + command index readiness','intelligence_rule':'backend summary only','energy_boundary_rule':'Energy publication is external boundary','deprecated_contract_rule':'legacy computation retired','migration_sequence_rule':'facade over V2','vehicle_property_resolution_rule':'exact component mapping','command_join_rule':'command_id','component_normalization_rule':'no frontend inference','active_health_rule':'runtime and release acceptance separate','footer_hard_gates_json':['sensor.mobility_runtime_health','sensor.mobility_release_acceptance_health'],'forbidden_ux_inferences_json':['source status fallback','command readiness inference','relationship reconstruction'],'intelligence_catalog_contract':'sensor.mobility_intelligence_index','requested_power_lifecycle_rule':'actual/readback by default','actual_current_rule':'numeric canonical current only','supervisory_rule':'backend-owned','product_display_rule':'display_value when published','health_separation_rule':'runtime != release acceptance','compatibility_cleanup_rule':'facade may be removed only after UX V2 cutover'}
            return 'ready',self._shaped(eid,attrs)
        if eid=='sensor.mobility_energy_asset_publication':
            e=self.facade.energy_v1(); consumers=e['consumer_assets']; connections=e['connection_assets']
            active=sum(1 for x in consumers if x.get('lifecycle_status')!='disabled')
            attrs={'contract_version':CONTRACT,'schema_version':'mobility_energy_asset_publication_v1','publication_role':'Mobility->Energy compatibility boundary','source_domain':'mobility','target_domain':'energy','total_energy_asset_count':len(consumers)+len(connections),'consumer_asset_count':len(consumers),'consumer_count':len(consumers),'active_consumer_count':active,'connection_asset_count':len(connections),'connection_count':len(connections),'republish_dependencies_json':[],'publication_boundary_rule':'V2 Mobility facts only; no physical bindings','consumer_assets':consumers,'connection_assets':connections,'health':'OK' if (self.manager.snapshots or self.manager.last_build_attempt.get('status')=='REMOVED') else 'WAITING_FOR_FOUNDATION','health_reason':'v2_projection','semantic_violations_json':[],'minimal_tech_debt_rule':'no duplicated computation','legacy_field_policy':'compatibility only','canonical_field_policy':'MOBILITY_ENERGY_V2','charging_relations':e['charging_relations'],'directional_connection_counters':e['directional_connection_counters'],'actual_power_kw_scope_rule':'physical charger meter is additive; vehicle is attributed/non-additive','primary_contract_shape_rule':'R43.2.65 compatible','energy_boundary_minimality_rule':'no raw integration details','operating_state_vocabulary':['idle','preparing','running','suspended','stopped','fault','unknown'],'last_command_result':self.controller.executor.snapshot().get('last_results',[])[-1] if self.controller.executor.snapshot().get('last_results') else None,'minimal_charging_contract_rule':'Mobility owns physical execution','canonical_charger_runtime_projection_rule':'V2 snapshot'}
            state=f'{active} active / {len(consumers)} consumers / {len(connections)} connections'
            return state,self._shaped(eid,attrs)
        if eid=='sensor.mobility_effective_charging_capability_index':
            caps=self.facade.capability_index(); rows=list(caps.values())
            return 'ready',self._shaped(eid,{'contract_version':CONTRACT,'consumer_visibility':'public_contract','index_schema':'effective_charging_capability_v1','semantic_rule':'Mobility domain capability only','dependency_rule':'explicit control profiles','formula':'P=U*I*phases','rounding_policy':'physical lattice','ownership_rule':'Mobility','capabilities':rows,'capabilities_by_asset':caps,'structural_health':'OK'})
        if eid in {'sensor.mobility_vehicle_profile_index','sensor.mobility_charger_profile_index','sensor.mobility_product_profile_index'}:
            if 'vehicle_' in eid: typ='vehicle'; rows=self.facade.profile_rows('vehicle')
            elif 'charger_' in eid: typ='charger'; rows=self.facade.profile_rows('charger')
            else: typ='product'; rows=self.facade.profile_rows('vehicle')+self.facade.profile_rows('charger')
            by={x['profile_id']:x for x in rows}
            return 'ready',self._shaped(eid,{'contract_version':CONTRACT,'index_schema':f'{typ}_profile_index_v1','index_type':typ,'consumer_visibility':'public_contract','selection_usage':'V2 domain config','key_field':'profile_id','label_field':'display_name','profile_source':'R43.2.65 migrated profile catalog','profiles':rows,'profiles_by_key':by,'selector_contract_json':{'options':[x['profile_id'] for x in rows]},'profile_alignment_json':[],'hard_backend_gates_json':[]})
        if eid in {'sensor.mobility_command_publication_health','sensor.mobility_relationship_integrity_health','sensor.mobility_vehicle_command_slot_health','sensor.mobility_charger_command_slot_health','sensor.mobility_intelligence_publication_health'}:
            violations=[]; state='OK'
            if eid=='sensor.mobility_relationship_integrity_health':
                violations=[r['relationship_id'] for r in relationships if r['from_asset_id'] not in self.manager.assets or r['to_asset_id'] not in self.manager.assets]
            if 'command_slot_health' in eid:
                typ='vehicle' if 'vehicle_' in eid else 'charger'; seen=[]
                for s in self.facade.command_slots(typ):
                    for rows in s.get('card_sections',{}).values(): seen.extend(x['command_id'] for x in rows)
                expected=[r['command_id'] for r in commands if r['asset_type']==typ and r['frontend_allowed']]
                violations=sorted(k for k in expected if seen.count(k)!=1)
            if eid=='sensor.mobility_intelligence_publication_health':
                violations=self._intelligence_violations()
            if violations: state='FAIL'
            attrs={'contract_version':CONTRACT,'release_version':RELEASE,'consumer_visibility':'diagnostics_only','release_gate':True,'violations_json':violations,'public_index':'sensor.mobility_command_index','execution_policy':'V2 only','vehicle_intelligence_count':len(self.facade.experience_rows('vehicle')),'expected_vehicle_intelligence_count':sum(a.concept_id=='vehicle' for a in self.manager.assets.values()),'charger_intelligence_count':len(self.facade.experience_rows('charger')),'expected_charger_intelligence_count':sum(a.concept_id=='charger' for a in self.manager.assets.values())}
            return state,self._shaped(eid,attrs)
        raise KeyError(eid)

    def publish(self) -> None:
        if not self._started: return
        for eid in self.facade.required_entity_ids:
            state,attrs=self._payload(eid)
            self.hass.states.async_set(eid,state,attrs,force_update=False)
