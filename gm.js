var loggedActions = {};
var suggestedMessages = [];
var suggestedActions = [];
var beingTargetted = {};
var attributes = {
	 BG:'Protect your target, killing their attacker and yourself.',
	 HEAL:'Heal your target.',
	 NOHEAL:'Cannot be healed after revealing.',
	 RB:'Roleblock your target.',
	 INVESTIGATE:'View the target\'s investigative results. Affected by Framer.',
	 JAIL:'Jail the target.',
	 EXECUTE:'Execute the jailed target.',
	 WATCH:'See all visitors to the target.',
	 MAFVISIT:'See who the Mafia visited.',
	 REVIVE:'Revive the target.',
	 CHECK:'View the target\'s alignment. Affected by Framer.',
	 DETECTIONIMMUNE:'Appears as Not Suspious to the Sheriff.',
	 TRANSPORT:'Swap all targets on your two targets.',
	 ALERT:'Kill anyone that targets you.',
	 MAFKILL:'Kill the target as member of the Mafia.',
	 VIGKILL:'Kill the target as Vigilante.',
	 SKKILL:'Kill the target as Serial Killer.',
	 IMMUNE:'Cannot die to KILL.',
	 BLACKMAIL:'Blackmail the target.',
	 CONSIG:'View the target\'s role.',
	 DISGUISE:'Disguise as the target, if they die.',
	 SWAPWILL:'Swap wills with the target, if they die.',
	 CLEAN:'Clean the target, if they die.',
	 REMEMBER:'Take the role of the target, if they are dead. Announce to the town.',
	 DOUSE:'Douse the target.',
	 IGNITE:'Ignite all doused targets.',
	 MULTI:'Target two players.',
	 SELF:'Can target themself.',
	 VEST:'Make yourself night immune.',
	 RBIMMUNE:'Cannot be roleblocked.',
	 RBATTACK:'Attack the roleblocker.',
	 MAUL:'Attack target and all visitors.',
	 CHARGE:'Charge someone with electricity.',
	 CONTROLIMMUNE:'Cannot be controlled.',
	 FRAME:'Make the target appear as member of the Mafia.',
	 FORGE:'Change targets last will.',
	 HAUNT:'Kills one of their guilty voters.',
	 // TARGET:'Player that needs to be lynched for victory.',
	 CONTROL:'Make your first target visit your second target.',
	 PASSIVE:'Your night action takes effect without you needing to send in an action.'
};
var autoRoles = 
	{
	'escort': {
		attributes: {
			RB:attributes.RB,
			RBIMMUNE:attributes.RBIMMUNE},
		grouping:'A',
		alignment:'town',
		priority: 2
	}, 
	'transporter': {
		attributes: {
			MULTI:attributes.MULTI,
			TRANSPORT:attributes.TRANSPORT,
			RBIMMUNE:attributes.RBIMMUNE,
			CONTROLIMMUNE:attributes.CONTROLIMMUNE,
			PRIO1:attributes.PRIO1, 
			SELF:attributes.SELF},
		grouping:'B',
		alignment:'town',
		priority: 4
	},
	'veteran': {
		attributes: {
			RBIMMUNE:attributes.RBIMMUNE,
			CONTROLIMMUNE:attributes.CONTROLIMMUNE,
			ALERT:attributes.ALERT},
		grouping:'C',
		alignment:'town'
	},
	'vigilante': {
		attributes: {
			VIGKILL:attributes.VIGKILL},
		grouping:'C',
		alignment:'town'
	},
	'sheriff': {
		attributes: {
			CHECK:attributes.CHECK},
		grouping:'D',
		alignment:'town'
	},
	'investigator': {
		attributes:  {
			INVESTIGATE:attributes.INVESTIGATE},
		grouping:'E',
		alignment:'town'
	},
	'lookout': {
		attributes:  {
			WATCH:attributes.WATCH},
		grouping:'F',
		alignment:'town'
	},
	'spy': {
		attributes:  {
			MAFVISIT:attributes.MAFVISIT,
			PASSIVE: attributes.PASSIVE
		},
		grouping:'G',
		alignment:'town'
	},
	'mayor': {
		attributes:  {
			NOHEAL:attributes.NOHEAL},
		grouping:'G',
		alignment:'town'
	},
	'medium': {
		attributes:  {},
		grouping:'H',
		alignment:'town'
	},
	'retributionist': {
		attributes:  {
			REVIVE:attributes.REVIVE},
		grouping:'I',
		alignment:'town'
	},
	'doctor': {
		attributes:  {
			HEAL:attributes.HEAL,
			SELF:attributes.SELF},
		grouping:'J',
		alignment:'town',
		priority: 1
	},
	'bodyguard': {
		attributes:  {
			BG:attributes.BG,
			SELF:attributes.SELF},
		grouping:'K',
		alignment:'town',
		priority: 1
	},
	'jailor': {
		attributes:  {
			JAIL:attributes.JAIL,
			EXECUTE:attributes.EXECUTE},
		grouping:'G',
		alignment:'town'
	},
	'godfather': {
		attributes:  {
			MAFKILL:attributes.MAFKILL,
			IMMUNE:attributes.IMMUNE,
			DETECTIONIMMUNE:attributes.DETECTIONIMMUNE},
		grouping:'D',
		alignment:'mafia'
	},
	// 'underboss' {},
	'blackmailer': {
		attributes:  {
			BLACKMAIL:attributes.BLACKMAIL},
		grouping:'F',
		alignment:'mafia'
	},
	'consigliere': {
		attributes:  {
			CONSIG:attributes.CONSIG},
		grouping:'E',
		alignment:'mafia'
	},
	'consort': {
		attributes:  {
			RB:attributes.RB,
			RBIMMUNE:attributes.RBIMMUNE},
		grouping:'A',
		alignment:'mafia',
		priority:2
	},
	'disguiser': {
		attributes:  {
			DISGUISE:attributes.DISGUISE,
			SWAPWILL:attributes.SWAPWILL
			},
		grouping:'K',
		alignment:'mafia'
	},
	'framer': {
		attributes:  {
			FRAME:attributes.FRAME},
		grouping:'L',
		alignment:'mafia'
	},
	'janitor': {
		attributes:  {
			CLEAN:attributes.CLEAN},
		grouping:'H',
		alignment:'mafia'
	},
	'forger': {
		attributes:  {
			FORGE:attributes.FORGE},
		grouping:'J',
		alignment:'mafia'
	},
	'serial killer': {
		attributes:  {
			SKKILL:attributes.SKKILL,
			RBATTACK:attributes.RBATTACK,
			IMMUNE:attributes.IMMUNE},
		grouping:'J',
		alignment:'sk'
	},
	'arsonist': {
		attributes:  {
			DOUSE:attributes.DOUSE,
			IGNITE:attributes.IGNITE,
			SELF:attributes.SELF,
			IMMUNE:attributes.IMMUNE},
		grouping:'F',
		alignment:'neutral'
	},
	'werewolf': {
		attributes:  {
			MAUL:attributes.MAUL,
			SELF:attributes.SELF,
			IMMUNE:attributes.IMMUNE},
		grouping:'K',
		alignment:'ww'
	},
	'jester': {
		attributes:  {
			HAUNT:attributes.HAUNT
		},
		grouping:'H',
		alignment:'neutral'
	},	
	'executioner': {
		attributes:  {
			// TARGET:attributes.TARGET
		},
		grouping:'D',
		alignment:'neutral'
	},
	'witch': {
		attributes:  {
			CONTROL:attributes.CONTROL,
			CONTROLIMMUNE:attributes.CONTROLIMMUNE
		},
		grouping:'I',
		alignment:'neutral',
		priority:3
	},
	'survivor': {
		attributes:  {
			VEST:attributes.VEST
		},
		grouping:'B',
		alignment:'neutral'
	},
	'amnesiac': {
		attributes:  {
			REMEMBER:attributes.REMEMBER
		},
		grouping:'B',
		alignment:'neutral'
	}
};

var investGrouping = {
	'A':'Your target is a manipulative beauty.',
	'B':'Your target avoids others.',
	'C':'Your target owns a gun.',
	'D':'Your target wants to gain others trust.',
	'E':'Your target gathers information.',
	'F':'Your target is very stealthy.',
	'G':'Your target is a part of the government.',
	'H':'Your target talks to themselves.',
	'I':'Your target is a loner.',
	'J':'Your target spends a lot of time sitting in an office.',
	'K':'Your target may not be what they seem.',
	'L':'Your target is not even trying to hide their evil deeds.',
};

var sheriffResults = {
	'town':'Your target is not suspicious',
	'mafia':'Your target is a member of the Mafia',
	'ww': ['Not Suspicious', 'Your target is a Werewolf'],
	'sw':'Your target is a Shadowalker.',
	'sk':'Your target is a Serial Killer.',
	'neutral':'Your target is not suspicious'
};
module.exports = {
	log:function(name,targets){
		loggedActions[name] = targets;
	},
	clear:function(){
		loggedActions = {};
		suggestedMessages = [];
		suggestedActions = [];
		beingTargetted = {};
	},
	evaluate:function(players, playernames, mod){
		var targets = {};
		var displayTargets = {};
		//Populate targets array.
		for (i in players)
		{
			if (mod != players[i].s.id)
			{
				targets[players[i].name] = [players[i].role,undefined, true];
				displayTargets[players[i].name] = [players[i].role,undefined, true, []];
				if (loggedActions[players[i].name])
				{
					targets[players[i].name][1] = loggedActions[players[i].name].slice(); //Add the target.
					displayTargets[players[i].name][1] = loggedActions[players[i].name].slice();
				}
				else
				{
					targets[players[i].name][1] = [];
				}
				//Populate the beingTargetted array for quick access.
				if (targets[players[i].name][1] != []) //If a player is targetting someone
				{
					for (k in targets[players[i].name][1]) //For all targetted players, add them to the list.
					{
						var t = targets[players[i].name][1][k];
						if (beingTargetted[t])
						{
							beingTargetted[t].push(players[i].name);
						}
						else
						{
							beingTargetted[t] = [players[i].name];
						}
					}
				}
				
			}
		}
		//Sort targets array by priority
		var orderedTargets = [];
		for (i in targets)
		{
			orderedTargets.push(i);
		}
		orderedTargets = orderedTargets.sort(function(one, two){
			var rolename1 = targets[one][0];
			var rolename2 = targets[two][0];
			var role1 = autoRoles[rolename1];
			var role2 = autoRoles[rolename2];
			var p1, p2;
			if (role1 === undefined)
			{
				p1 = 0;
			}
			else
			{
				p1 = role1.priority;
			}
			if (role2 === undefined)
			{
				p2 = 0;
			}
			else
			{
				p2 = role2.priority;
			}
			if (p1 === undefined)
			{
				p1 = 0;
			}
			if (p2 === undefined)
			{
				p2 = 0;
			}
			return (p2 > p1);
		});
		//Loop through roles in priority order.
		for (i in orderedTargets)
		{
			var num = orderedTargets[i];
			var role = getRole(targets[num]);
			var roleInfo = autoRoles[role];
			if (roleInfo) //If role is automated
			{
				console.log(targets[num]);
				if (Object.keys(targets[num][1]).length != 0) //If they sent in a night action.
				{
					var roleAttributes = roleInfo.attributes;
					//If they are not self targetting, or are allowed to self target anyway. 
					//Exception variable for witches and transporters.
					console.log(targets[num]);
					if (targets[num][1] != num || roleAttributes.SELF || targets[num].targetChanged)
					{
						if (roleAttributes.TRANSPORT) //Transport
						{
							//Ensure two targets were used.
							var t = targets[num][1];
							if (t.length == 2 )
							{
								//Swap all targets on the two players.
								for (j in targets)
								{
									if (targets[j][1].indexOf(t[0]) != -1 && j != num)
									{
										var index = targets[j][1].indexOf(t[0]);
										//Remove the previous target.
										var prevTarget = targets[j][1][0];
										var pindex = beingTargetted[prevTarget].indexOf(j);
										beingTargetted[prevTarget].splice(pindex,1);
										//This person targetted one of the players being transported. Switch them to the other one.
										targets[j][1][index] = t[1];
										displayTargets[j][3].push('transport');
										//Add a variable allowing them to self target now.
										targets[j].targetChanged = true;
										//Add reference to the new target.
										if (beingTargetted[t[1]])
										{
											beingTargetted[t[1]].push(j);
										}
										else
										{
											beingTargetted[t[1]]= [ j ];
										}
									}
									else if (targets[j][1].indexOf(t[1]) != -1 && j != num)
									{
										var index = targets[j][1].indexOf(t[1]);
										//Remove the previous target.
										var prevTarget = targets[j][1][0];
										var pindex = beingTargetted[prevTarget].indexOf(j);
										beingTargetted[prevTarget].splice(pindex,1);
										//This person targetted one of the players being transported. Switch them to the other one.
										targets[j][1][index] = t[0];
										displayTargets[j][3].push('transport');
										//Add a variable allowing them to self target now.
										targets[j][1][index].targetChanged = true;
										//Add reference to the new target.
										if (beingTargetted[t[1]])
										{
											beingTargetted[t[0]].push(j);
										}
										else
										{
											beingTargetted[t[0]]= [ j ];
										}
									}
								}
							}
							else
							{
								displayTargets[num][2] = {auto:false,reason:'Incorrect number of targets.'}; //Set the role to not automated.
							}
						}
						else if (roleAttributes.CONTROL) //Witching
						{
							//Ensure two targets were used.
							var t = targets[num][1];
							if (t.length == 2 )
							{
								var person = targets[t[0]];
								var personRole = getRole(person);
								if (autoRoles[personRole].CONTROLIMMUNE)
								{
									//Inform the person being controlled of the failure.
									addSuggestedMessage('A witch tried to control you, but you are immune!',undefined);
								}
								else
								{
									//Inform the person being controlled
									addSuggestedMessage('You felt a mysterious power dominating you. You were controlled by a Witch!',t[0]);
									//Remove the previous target.
									var prevTarget = targets[t[0]][1];
									if (prevTarget.length > 0) //If the player was originally targetting someone.
									{
										var index = beingTargetted[prevTarget].indexOf(t[0]);
										beingTargetted[prevTarget].splice(index,1);
									}
									//Change their target.
									targets[t[0]][1] = [t[1]];
									//Add a variable allowing them to self target now.
									targets[t[0]].targetChanged = true;
									//Add reference for new target.
									if (beingTargetted[t[1]])
									{
										beingTargetted[t[1]].push(t[0]);
									}
									else
									{
										beingTargetted[t[1]]= [ t[0] ];
									}
									//Highlight the person in the target display.
									displayTargets[t[0]][3].push('witched');
								}
							}
							else
							{
								displayTargets[players[num].name][2] = {auto:false,reason:'Incorrect number of targets.'}; //Set the role to not automated.
							}
						}
						else if (roleAttributes.RB) //Roleblocking
						{
							var t = targets[num][1];
							var person = targets[t[0]];
							var personRole = getRole(person);
							//If the person is not immune to roleblocking
							if (!autoRoles[personRole].attributes.RBIMMUNE)
							{
								if (autoRoles[personRole].attributes.RBATTACK)
								{
									displayTargets[t[0]][3].push('rbattack');
									var prevTarget = targets[t[0]][1];
									//Remove the reference to the previous target.
									if (prevTarget.length > 0)
									{
										var index = beingTargetted[prevTarget].indexOf(t[0]);
										beingTargetted[prevTarget].splice(index,1);
									}
									//Move the target to the roleblocker.
									targets[t[0]][1] = [num];
									//Add the reference to the new target.
									if (beingTargetted[num])
									{
										beingTargetted[num].push(t[0]);
									}
									else
									{
										beingTargetted[num] = [ t[0] ];
									}
									addSuggestedMessage("Someone roleblocked you, so you attacked them!",t[0]);
									addSuggestedMessage("You were attacked by the Serial Killer you visited!",num);
								}
								else
								{
									displayTargets[t[0]][3].push('rbd');
									//If they are actually targetting someone
									if (targets[t[0]][1].length > 0)
									{
										//Remove the reference to the target.
										var prevTarget = targets[t[0]][1];
										var index = beingTargetted[prevTarget].indexOf(t[0]);
										beingTargetted[prevTarget].splice(index,1);
									}
									//Cancel the target.
									targets[t[0]][1] = [];
									//Inform the player they were roleblocked.
									addSuggestedMessage("Someone occupied your night, you were roleblocked!",t[0]);
								}
							}
							else
							{
								//Inform the person of the failure.
								addSuggestedMessage('Someone tried to roleblock you, but you are immune.',t[0]);
								//addSuggestedMessage('Your target is immune to roleblocks.',num); 
							}
						}
						else if (roleAttributes.BG) //Bodyguard.
						{
							var t = targets[num][1];
							var person = targets[t[0]];
							//Check if a person with KILL or DOUSE is targetting this person.
							var visitors = getPeopleTargetting(t[0]);
							for (j in visitors)
							{
								//Kill or douse
								var name = visitors[j];
								var role = getRole(targets[name]);
								var autorole = autoRoles[role];
								if (autorole !== undefined)
								{
									var attrib = autorole.attributes;
									if (attrib.MAFKILL || attrib.VIGKILL || attrib.DOUSE || attrib.MAUL || attrib.SKKILL)
									{
										addSuggestedMessage("Someone tried to attack you, but someone fought off your attacker." ,t[0]); //Tell target they were guarded.
										addSuggestedMessage('You were killed by a bodyguard.',visitors[j]); //Tell attacker they were killed by a bg
										addSuggestedMessage('You successfully protected your target.',num); //Tell bg that they succeeded
										//Suggested actions: Kill both the bg and attacker
										addSuggestedAction('Kill', num);
										addSuggestedAction('Kill', visitors[j]);
										//Death announcements
										addSuggestedMessage('They died protecting their target.','<All>');
										addSuggestedMessage('They were killed by a [town]Bodyguard[/town].','<All>');
										//Make a note of which attacker the bg killed, for use when calculating whether or not their target dies anyway.
										targets[num].bgKill = visitors[j];
										break; //break, bg can only stop one attacker.
									}
								}
							}
						}
						else if (roleAttributes.HEAL) //Heal.
						{
							var t = targets[num][1];
							var person = targets[t[0]];
							//Check if a person with a KILL is targetting this person.
							var visitors = getPeopleTargetting(t[0]);
							for (j in visitors)
							{
								var name = visitors[j];
								var role = getRole(targets[name]);
								var autorole = autoRoles[role];
								if (autorole !== undefined)
								{
									var attrib = autorole.attributes;
									if (attrib.MAFKILL || attrib.VIGKILL || attrib.MAUL || attrib.SKKILL)
									{
										//Successful heal!
										addSuggestedMessage('You were attacked but someone nursed you back to health!',t[0]);
										addSuggestedMessage('Your target was attacked last night.',num);
										//Kill is stopped by the corresponding check in its section.
									}
								}
							}
						}
						else if (roleAttributes.MAFKILL || roleAttributes.SKKILL || roleAttributes.VIGKILL)
						{
							var t = targets[num][1];
							var peopleTargetting = getPeopleTargetting(t[0]);
							var attackSuccess = true;
							for (i in peopleTargetting) //Loop through and check for heals
							{
								var person = targets[peopleTargetting[i]];
								var role = getRole(person);
								var attrib = autoRoles[role].attributes;
								if (attrib.HEAL)
								{
									//Person was healed, attack fails silently.
									attackSuccess = false;
								}
								else if (attrib.BG)
								{
									//More complicated, attack only fails if this is the person the bg killed.
									if (person.bgKill == num)
									{
										attackSuccess = false;
									}
								}
							}
							//Check for night immunity
							var role = getRole(targets[t[0]]);
							if (autoRoles[role].attributes.IMMUNE)
							{
								attackSuccess = false;
								//Inform the person they were attacked, inform the attacker their target was immune.
								addSuggestedMessage('You were attacked, but you are immune at night!',t[0]);
								addSuggestedMessage('Your target was immune to your attack!',num)
							}
							if (attackSuccess)
							{
								var msg = '';
								var announce = '';
								//Attack successful!
								if (roleAttributes.MAFKILL)
								{
									msg =  'You were attacked by a member of the Mafia!';
									announce = 'They were killed by a member of the [maf]Mafia[/maf].';
								}
								else if (roleAttributes.SKKILL)
								{
									msg =  'You were attacked by a Serial Killer!';
									announce = 'They were killed by a [sk]Serial Killer[/sk].';
								}
								else if (roleAttributes.VIGKILL)
								{
									msg =  'You were shot by a Vigilante!';
									announce = 'They were shot by a [town]Vigilante[/town].';
								}
								addSuggestedMessage(msg,t[0]);
								addSuggestedMessage(announce,'<All>');
								addSuggestedAction('Kill',t[0]);
							}
						}
						else if (roleAttributes.CHECK)
						{
							var t = targets[num][1];
							var name = t[0];
							var role = getRole(targets[name]);
							if (autoRoles[role])
							{
								var alignment = autoRoles[role].alignment;
								if (autoRoles[role].attributes.DETECTIONIMMUNE)
								{
									alignment = 'town';
								}
								//If the person is framed, return a mafia result
								var visitors = getPeopleTargetting(t[0]);
								for (j in visitors)
								{
									var name = visitors[j];
									var person = targets[name];
									var role = getRole(person);
									var attrib = autoRoles[role].attributes;
									if (attrib.FRAME)
									{
										alignment = 'mafia';
									}
								}
								//Send this player's alignment
								var msg = sheriffResults[alignment];
								addSuggestedMessage(msg,num);
							}
							else
							{
								displayTargets[num][2] = {auto:false,reason:'Player is checking a player with a role that is not automated.'}; //Set the role to not automated.
							}
						}
						else if (roleAttributes.WATCH) //Lookout type roles
						{
							//Just list the people that visited your target.
							var t = targets[num][1];
							var name = t[0];
							var visitors = getPeopleTargetting(name);
							visitors.splice(visitors.indexOf(num),1); //Remove the person watching from the list.
							//Grammar
							var str = '';
							if (visitors.length > 1)
							{
								str = visitors.slice(0,visitors.length-1).join(', ') + ' and ' + visitors[visitors.length -1]+'.';
							}
							else if (visitors.length == 1)
							{
								str = visitors[0];
							}
							if (str != '')
							{
								addSuggestedMessage(str+' visited your target last night!',num);
							}
						}
						else if (roleAttributes.INVESTIGATE) //Investigatives
						{
							//Fetch the person's investigative results.
							var t = targets[num][1];
							var role = getRole(targets[t[0]]);
							role = autoRoles[role];
							if (role)
							{
								var group = role.grouping;
								//If they have been framed, they automatically get the invest group of the framer.
								var visitors = getPeopleTargetting(t[0]);
								for (i in visitors)
								{
									var name = visitors[i];
									var vrole = getRole(targets[name]);
									var attrib = autoRoles[vrole].attributes;
									if (attrib.FRAME)
									{
										//Target was framed, they get the same group as the framer.
										group = autoRoles[vrole].grouping;
									}
								}
								var results = investGrouping[group];
								var possibleRoles = getInvestGroupings(group);
								//Grammar
								var str = results+' ';
								if (possibleRoles.length == 1)
								{
									str += 'They must be a ' + possibleRoles[0]+'.';
								}
								else
								{
									str += 'They could be a ';
									str += possibleRoles.slice(0,possibleRoles.length-1).join(', ') + ' or ' + possibleRoles[possibleRoles.length-1]+'.';
								}
								addSuggestedMessage(str,num);
							}
							else
							{
								displayTargets[num][2] = {auto:false,reason:'Player is investigating a role that is not automated.'}; //Set the role to not automated.
							}
						}
						else if (roleAttributes.BLACKMAIL)
						{
							var t = targets[num][1];
							var player = players[playernames[t[0]]];
							//If the player was not jailed.
							if (!player.chats.jailed)
							{
								addSuggestedAction('Blackmail',t[0]);
							}
							else
							{
								addSuggestedMessage('Someone tried to blackmail you, but you were in jail.',t[0]);
							}
						}
						else if (roleAttributes.CONSIG) //Absolute check
						{
							var t = targets[num][1];
							var role = getRole(targets[t[0]]);
							addSuggestedMessage("Your target is a "+capitalize(role)+'.',num);
						}
						else if (roleAttributes.CLEAN) //Role cleaning
						{
							var t = targets[num][1];
							//If someone is killing them.
							var visitors = getPeopleTargetting(t[0]); 
							for (j in visitors)
							{
								
							}
						}
					}
					else
					{
						displayTargets[num][2] = {auto:false,reason:'Player is self-targetting, but role cannot self target.'}; //Set the role to not automated.
					}
				}
				else
				{
					var roleAttributes = roleInfo.attributes;
					if (roleAttributes.PASSIVE) //If they have a passive night action.
					{
						if (roleAttributes.MAFVISIT) //Sees who mafia visits.
						{
							var visits = [];
							for (i in players)
							{
								if (players[i].chats.mafia)
								{
									var name = players[i].name;
									if (Object.keys(targets[name][1]).length != 0) //if they sent in a night action
									{
										visits = visits.concat(targets[name][1]);
									}
								}
							}
							//Grammar
							var str = '';
							if (visits.length == 1)
							{
								str = "The mafia visited "+visits[0]+" last night.";
							}
							else
							{
								str = "The mafia visited " + visits.slice(0,visits.length-1).join(', ') +" and "+visits[visits.length-1] +" last night.";
							}
							addSuggestedMessage(str,num);
						}
					} 
				}
			}
			else
			{
				displayTargets[num][2] = {auto:false,reason:'Role not in system.'}; //Set the role to not automated.
			}
		}
		console.log(beingTargetted);
		//Return array of messages to send and actions to take.
		return {
			targets: displayTargets,
			messages: suggestedMessages,
			actions: suggestedActions
		}
		
	}
}
function addSuggestedMessage(msg,to)
{
	suggestedMessages.push([to,msg]);
}
function addSuggestedAction(type,msg)
{
	suggestedActions.push(['<'+type+'>',msg]);
}
function getRole(person)
{
	return (person[0].toLowerCase());
}
function getPeopleTargetting(name)
{
	return (beingTargetted[name]);
}
function getInvestGroupings(grouping)
{
	var arr = [];
	for (i in autoRoles)
	{
		if (autoRoles[i].grouping == grouping)
		{
			arr.push(capitalize(i));
		}
	}
	return arr;
}
function capitalize(str)
{
	var arr = str.split(' ');
	for (i in arr)
	{
		arr[i] = arr[i][0].toUpperCase() + arr[i].substring(1,arr[i].length)
	} 
	return arr.join(' ');
}
