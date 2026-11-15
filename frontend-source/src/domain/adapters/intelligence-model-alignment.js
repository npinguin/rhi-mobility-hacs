// 06-intelligence-model-alignment.js
// R22.11.17 intelligence model alignment.
//
// R39 backend introduces domain, subdomain and asset intelligence model contracts
// (mobility.*, fleet.*, connections.*, owners.*, vehicle.*, charger.*). The UX
// consumes intelligence only through the public runtime layer. It prepares the family
// resolver to render intelligence properties and insights when published through approved public runtime contracts.

const HI_MOBILITY_INTELLIGENCE_MODEL_ALIGNMENT = Object.freeze({
  backend_model_reference: "R22.8.1.39_INTELLIGENCE_PROPERTY_MODEL",
  active_runtime_baseline: "R22.8.1.37.1 / R22.8.1.16-compatible public indexes",
  runtime_policy: "no_hard_dependency_on_r39_runtime",
  allowed_publication_path: ["vehicle_property_index", "charger_property_index", "person_property_index", "intelligence_index"],
  prepared_prefixes: {
    "mobility.": "domain intelligence, rendered only when published",
    "fleet.": "subdomain/fleet intelligence, rendered only when published",
    "connections.": "connection/charger intelligence, rendered only when published",
    "owners.": "owner/presence intelligence, rendered only when published",
    "vehicle.": "asset intelligence, existing runtime path",
    "charger.": "asset intelligence, existing runtime path"
  }
});
