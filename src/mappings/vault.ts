import { Lock, AssignGuildCall } from '../../generated/VaultDiamond/VaultDiamond'
import { getOrCreateGotchi } from "../helper/realm";

export function handleLock(event: Lock): void {
  let gotchi = getOrCreateGotchi(event.params._tokenId);
  gotchi.locked = event.params._isLocked;
  gotchi.save();
}

export function handleAssignGuild(call: AssignGuildCall): void {
  let gotchis = call.inputs._tokenIds;

  for(let i = 0; i < gotchis.length; i++){
      let gotchi = getOrCreateGotchi(gotchis[i]);
      gotchi.guild = call.inputs._guild;
      gotchi.save();
  }
}