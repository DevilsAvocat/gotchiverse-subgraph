import { store } from "@graphprotocol/graph-ts";
import { AlchemicaClaimed, ChannelAlchemica, EquipInstallation, EquipTile, ExitAlchemica, InstallationUpgraded, UnequipInstallation, UnequipTile } from "../../generated/RealmDiamond/RealmDiamond";
import { Stat } from "../../generated/schema";
import { BIGINT_ONE, StatCategory } from "../helper/constants";
import { getOrCreateInstallationType, getOrCreateTile } from "../helper/installation";
import { createAlchemicaClaimedEvent, createChannelAlchemicaEvent, createEquipInstallationEvent, createEquipTileEvent, createExitAlchemicaEvent, createInstallationUpgradedEvent, createParcelInstallation, createUnequipInstallationEvent, createUnequipTileEvent, getOrCreateGotchi, getOrCreateParcel, removeParcelInstallation } from "../helper/realm";
import { getStat, updateAlchemicaClaimedStats, updateChannelAlchemicaStats, updateExitedAlchemicaStats, updateInstallationEquippedStats, updateInstallationUnequippedStats, updateInstallationUpgradedStats, updateTileEquippedStats, updateTileUnequippedStats } from "../helper/stats";

export function handleChannelAlchemica(event: ChannelAlchemica): void  {
    // create and persist event
    let eventEntity = createChannelAlchemicaEvent(event); 
    eventEntity.save();

    // update gotchi and parcel entities
    let gotchi = getOrCreateGotchi(event.params._gotchiId);
    gotchi.lastChanneledAlchemica = event.block.timestamp;
    gotchi.save();

    let parcel = getOrCreateParcel(event.params._realmId);
    parcel.lastChanneledAlchemica = event.block.timestamp;
    parcel.save();
    
    // update stats
    let gotchiStats = getStat(StatCategory.GOTCHI, eventEntity.gotchi)
    gotchiStats.countChannelAlchemicaEvents = gotchiStats.countChannelAlchemicaEvents.plus(BIGINT_ONE);
    gotchiStats = updateChannelAlchemicaStats(gotchiStats, event.params._alchemica);
    gotchiStats.save();

    let parcelStats = getStat(StatCategory.PARCEL, eventEntity.parcel)
    parcelStats.countChannelAlchemicaEvents = parcelStats.countChannelAlchemicaEvents.plus(BIGINT_ONE);
    parcelStats = updateChannelAlchemicaStats(parcelStats, event.params._alchemica);
    parcelStats.save();

    let userStats = getStat(StatCategory.USER, event.transaction.from.toHexString())
    userStats.countChannelAlchemicaEvents = userStats.countChannelAlchemicaEvents.plus(BIGINT_ONE);
    userStats = updateChannelAlchemicaStats(userStats, event.params._alchemica);
    userStats.save();

    let overallStats = getStat(StatCategory.OVERALL)
    overallStats.countChannelAlchemicaEvents = overallStats.countChannelAlchemicaEvents.plus(BIGINT_ONE);
    overallStats = updateChannelAlchemicaStats(overallStats, event.params._alchemica);
    overallStats.save();
}

export function handleExitAlchemica(event: ExitAlchemica): void {
    let eventEntity = createExitAlchemicaEvent(event);
    eventEntity.save();

    // stats
    let overallStats = getStat(StatCategory.OVERALL);
    overallStats = updateExitedAlchemicaStats(overallStats, event.params._alchemica);
    overallStats.save();

    let gotchiStats = getStat(StatCategory.GOTCHI, event.params._gotchiId.toString());
    gotchiStats = updateExitedAlchemicaStats(gotchiStats, event.params._alchemica);
    gotchiStats.save();
}

export function handleAlchemicaClaimed(event: AlchemicaClaimed): void {
    let eventEntity = createAlchemicaClaimedEvent(event);
    eventEntity.save();

    // stats
    let overallStats = getStat(StatCategory.OVERALL);
    overallStats = updateAlchemicaClaimedStats(overallStats, event.params._alchemicaType.toI32(), event.params._amount);
    overallStats.save();

    let userStats = getStat(StatCategory.USER, event.transaction.from.toHexString());
    userStats = updateAlchemicaClaimedStats(userStats, event.params._alchemicaType.toI32(), event.params._amount);
    userStats.save();

    let gotchiStats = getStat(StatCategory.GOTCHI, event.params._gotchiId.toString());
    gotchiStats = updateAlchemicaClaimedStats(gotchiStats, event.params._alchemicaType.toI32(), event.params._amount);
    gotchiStats.save();
}

export function handleEquipInstallation(event: EquipInstallation): void {
    let eventEntity = createEquipInstallationEvent(event);
    eventEntity.save();

    // create if not exist
    let parcel = getOrCreateParcel(event.params._realmId);
    parcel = createParcelInstallation(parcel, event.params._installationId);
    parcel.save();

    // update stats
    let parcelStats = getStat(StatCategory.PARCEL, eventEntity.parcel);
    parcelStats.countParcelInstallations = parcelStats.countParcelInstallations.plus(BIGINT_ONE);
    parcelStats = updateInstallationEquippedStats(parcelStats);
    parcelStats.save();

    let overallStats = getStat(StatCategory.OVERALL)
    overallStats.countParcelInstallations = overallStats.countParcelInstallations.plus(BIGINT_ONE);
    overallStats = updateInstallationEquippedStats(overallStats);
    overallStats.save();

    let userStats = getStat(StatCategory.USER, event.transaction.from.toHexString());
    userStats.countParcelInstallations = userStats.countParcelInstallations.plus(BIGINT_ONE);
    userStats = updateInstallationEquippedStats(userStats);
    userStats.save();
}

export function handleUnequipInstallation(event: UnequipInstallation): void {
    let eventEntity = createUnequipInstallationEvent(event);
    eventEntity.save();

    let parcel = getOrCreateParcel(event.params._realmId);
    parcel = removeParcelInstallation(parcel, event.params._installationId);
    parcel.save();

    // update stats
    let userStats = getStat(StatCategory.USER, event.transaction.from.toHexString());
    userStats = updateInstallationUnequippedStats(userStats);
    userStats.save();

    let parcelStats = getStat(StatCategory.PARCEL, eventEntity.parcel)
    parcelStats = updateInstallationUnequippedStats(parcelStats);
    parcelStats.save();

    let overallStats = getStat(StatCategory.OVERALL)
    overallStats = updateInstallationUnequippedStats(overallStats);
    overallStats.save();
}

export function handleInstallationUpgraded(event: InstallationUpgraded): void {
    let eventEntity = createInstallationUpgradedEvent(event);
    eventEntity.save();

    let type = getOrCreateInstallationType(event.params._nextInstallationId, event);
    type.save();

    let parcel = getOrCreateParcel(event.params._realmId);
    parcel = removeParcelInstallation(parcel, event.params._prevInstallationId);
    parcel = createParcelInstallation(parcel, event.params._nextInstallationId);
    parcel.save();

    // stats
    let overallStats = getStat(StatCategory.OVERALL);
    overallStats = updateInstallationUpgradedStats(overallStats);
    overallStats.save();

    let parcelStats = getStat(StatCategory.PARCEL, event.params._realmId.toString());
    parcelStats = updateInstallationUpgradedStats(parcelStats);
    parcelStats.save();
}

export function handleEquipTile(event: EquipTile): void {
    let eventEntity = createEquipTileEvent(event);
    eventEntity.save();

    let tile = getOrCreateTile(event.params._tileId);
    tile.save();
    
    // stats
    let userStats = getStat(StatCategory.USER, event.transaction.from.toHexString());
    userStats = updateTileEquippedStats(userStats);
    userStats.save();

    let overallStats = getStat(StatCategory.OVERALL);
    overallStats = updateTileEquippedStats(overallStats);
    overallStats.save();

    let parcelStats = getStat(StatCategory.PARCEL, eventEntity.parcel!);
    parcelStats = updateTileEquippedStats(parcelStats);
    parcelStats.save();
}

export function handleUnequipTile(event: UnequipTile): void {
    // event
    let eventEntity = createUnequipTileEvent(event);
    eventEntity.save();

    let tile = getOrCreateTile(event.params._tileId);
    tile.save();

    // stats
    let userStats = getStat(StatCategory.USER, event.transaction.from.toHexString());
    userStats = updateTileUnequippedStats(userStats);
    userStats.save();

    let overallStats = getStat(StatCategory.OVERALL);
    overallStats = updateTileUnequippedStats(overallStats);
    overallStats.save();

    let parcelStats = getStat(StatCategory.PARCEL, eventEntity.parcel!);
    parcelStats = updateTileUnequippedStats(parcelStats);
    parcelStats.save();
}