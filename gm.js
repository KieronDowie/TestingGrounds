var loggedActions = {};
var suggestedMessages = [];
var suggestedActions = [];
var beingTargetted = {};
var daynumber = 1;
var rainnumber = 0;
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
	 FORCEDMULTI:'Has to target two players.',
	 SELF:'Can target themself.',
	 NOVISIT:'Can only target themself.',
	 VEST:'Make yourself night immune.',
	 NINJA:'Not spotted by WATCHES when visiting.',
	 RBIMMUNE:'Cannot be roleblocked.',
	 RBATTACK:'Attack the roleblocker.',
	 RBHOME:'Stays home when roleblocked.',
	 MAUL:'Attack target and all visitors.',
	 MUSTVISIT:'Must visit each night. If not visiting visits themselves instead.',
	 MUSTVISITEVEN:'Must visit each even night. If not visiting visits themselves instead.',
	 CHARGE:'Charge someone with electricity.',
	 CONTROLIMMUNE:'Cannot be controlled.',
	 FRAME:'Make the target appear as member of the Mafia.',
	 FULLMOONSHERIFFRESULT:'During a full moon the target shows as a Werewolf to the Sheriff.',
	 FORGE:'Change targets last will.',
	 HAUNT:'Kills one of their guilty voters.',
	 // TARGET:'Player that needs to be lynched for victory.',
	 CONTROL:'Make your first target visit your second target.',
	 PASSIVE:'Your night action takes effect without you needing to send in an action.',
	 /*Targetting attributes*/
	 DEADTARGET:'Able to target players that are dead.',
	 NOLIVINGTARGET:'Unable to target living players.',
	 RAINDANCE:'Let it rain next night'
};
var autoRoles = 
	{
	'escort': {
		attributes: {
			RB:attributes.RB,
			RBIMMUNE:attributes.RBIMMUNE},
		grouping:'A',
		consiggrouping:'Escort',
		alignment:'town',
		priority: 2
	}, 
	'transporter': {
		attributes: {
			MULTI:attributes.MULTI,
			FORCEDMULTI:attributes.FORCEDMULTI,
			TRANSPORT:attributes.TRANSPORT,
			RBIMMUNE:attributes.RBIMMUNE,
			CONTROLIMMUNE:attributes.CONTROLIMMUNE,
			PRIO1:attributes.PRIO1, 
			SELF:attributes.SELF},
		grouping:'N',
		consiggrouping:'Transporter',
		alignment:'town',
		priority: 4
	},
	'veteran': {
		attributes: {
			RBIMMUNE:attributes.RBIMMUNE,
			CONTROLIMMUNE:attributes.CONTROLIMMUNE,
			SELF:attributes.SELF,
			ALERT:attributes.ALERT,
			NINJA:attributes.NINJA,
			NOVISIT:attributes.NOVISIT
			},
		grouping:'G',
		consiggrouping:'Veteran',
		alignment:'town'
	},
	'vigilante': {
		attributes: {
			VIGKILL:attributes.VIGKILL},
		grouping:'F',
		consiggrouping:'Vigilante',
		alignment:'town'
	},
	'sheriff': {
		attributes: {
			CHECK:attributes.CHECK},
		grouping:'C',
		consiggrouping:'Sheriff',
		alignment:'town'
	},
	'investigator': {
		attributes:  {
			INVESTIGATE:attributes.INVESTIGATE},
		grouping:'B',
		consiggrouping:'Investigator',
		alignment:'town'
	},
	'lookout': {
		attributes:  {
			WATCH:attributes.WATCH
		},
		grouping:'J',
		consiggrouping:'Lookout',
		alignment:'town'
	},
	'spy': {
		attributes:  {
			MAFVISIT:attributes.MAFVISIT,
			PASSIVE: attributes.PASSIVE
		},
		grouping:'D',
		consiggrouping:'Spy',
		alignment:'town'
	},
	'mayor': {
		attributes:  {
			NOHEAL:attributes.NOHEAL},
		grouping:'I',
		consiggrouping:'Mayor',
		alignment:'town'
	},
	'medium': {
		attributes:  {},
		grouping:'L',
		consiggrouping:'Medium',
		alignment:'town'
	},
	'retributionist': {
		attributes:  {
			REVIVE:attributes.REVIVE,
			DEADTARGET:attributes.DEADTARGET,
			NOLIVINGTARGET:attributes.NOLIVINGTARGET
		},
		grouping:'K',
		consiggrouping:'Retributionist',
		alignment:'town'
	},
	'doctor': {
		attributes:  {
			HEAL:attributes.HEAL,
			SELF:attributes.SELF},
		grouping:'E',
		consiggrouping:'Doctor',
		alignment:'town',
		priority: 1
	},
	'bodyguard': {
		attributes:  {
			BG:attributes.BG,
			SELF:attributes.SELF},
		grouping:'I',
		consiggrouping:'Bodyguard',
		alignment:'town',
		priority: 1
	},
	'jailor': {
		attributes:  {
			JAIL:attributes.JAIL,
			EXECUTE:attributes.EXECUTE},
		grouping:'C',
		consiggrouping:'Jailor',
		alignment:'town'
	},
	'godfather': {
		attributes:  {
			MAFKILL:attributes.MAFKILL,
			IMMUNE:attributes.IMMUNE,
			DETECTIONIMMUNE:attributes.DETECTIONIMMUNE},
		grouping:'C',
		consiggrouping:'Godfather',
		alignment:'mafia'
	},
	'mafioso': {
		attributes:  {
			MAFKILL:attributes.MAFKILL,
			DEADTARGET:attributes.DEADTARGET,},
		grouping:'F',
		consiggrouping:'Mafioso',
		alignment:'mafia'
	},
	'blackmailer': {
		attributes:  {
			BLACKMAIL:attributes.BLACKMAIL},
		grouping:'D',
		consiggrouping:'Blackmailer',
		alignment:'mafia'
	},
	'consigliere': {
		attributes:  {
			CONSIG:attributes.CONSIG},
		grouping:'B',
		consiggrouping:'Consigliere',
		alignment:'mafia'
	},
	'consort': {
		attributes:  {
			RB:attributes.RB,
			RBIMMUNE:attributes.RBIMMUNE},
		grouping:'A',
		consiggrouping:'Consort',
		alignment:'mafia',
		priority:2
	},
	'disguiser': {
		attributes:  {
			DISGUISE:attributes.DISGUISE,
			SWAPWILL:attributes.SWAPWILL
			},
		grouping:'G',
		consiggrouping:'Disguiser',
		alignment:'mafia'
	},
	'framer': {
		attributes:  {
			FRAME:attributes.FRAME},
		grouping:'M',
		consiggrouping:'Framer',
		alignment:'mafia'
	},
	'janitor': {
		attributes:  {
			CLEAN:attributes.CLEAN},
		grouping:'H',
		consiggrouping:'Janitor',
		alignment:'mafia'
	},
	'forger': {
		attributes:  {
			FORGE:attributes.FORGE},
		grouping:'L',
		consiggrouping:'Forger',
		alignment:'mafia'
	},
	'serial killer': {
		attributes:  {
			SKKILL:attributes.SKKILL,
			RBATTACK:attributes.RBATTACK,
			IMMUNE:attributes.IMMUNE},
		grouping:'E',
		consiggrouping:'Serial Killer',
		alignment:'sk'
	},
	'arsonist': {
		attributes:  {
			DOUSE:attributes.DOUSE,
			IGNITE:attributes.IGNITE,
			SELF:attributes.SELF,
			IMMUNE:attributes.IMMUNE},
		grouping:'M',
		consiggrouping:'Arsonist',
		alignment:'arsonist'
	},
	'werewolf': {
		attributes:  {
			MAUL:attributes.MAUL,
			SELF:attributes.SELF,
			IMMUNE:attributes.IMMUNE,
			FULLMOONSHERIFFRESULT:attributes.FULLMOONSHERIFFRESULT,
			MUSTVISITEVEN:attributes.MUSTVISITEVEN,
			RBHOME:attributes.RBHOME},
		grouping:'I',
		consiggrouping:'Werewolf',
		alignment:'ww'
	},
	'jester': {
		attributes:  {
			HAUNT:attributes.HAUNT
		},
		grouping:'E',
		consiggrouping:'Jester',
		alignment:'neutral'
	},	
	'executioner': {
		attributes:  {
			// TARGET:attributes.TARGET
		},
		grouping:'C',
		consiggrouping:'Executioner',
		alignment:'neutral'
	},
	'witch': {
		attributes:  {
			CONTROL:attributes.CONTROL,
			CONTROLIMMUNE:attributes.CONTROLIMMUNE,
			MULTI:attributes.MULTI,
			FORCEDMULTI:attributes.MULTI
		},
		grouping:'J',
		consiggrouping:'Witch',
		alignment:'neutral',
		priority:3
	},
	'survivor': {
		attributes:  {
			VEST:attributes.VEST,
			SELF:attributes.SELF,
			NINJA:attributes.NINJA,
			NOVISIT:attributes.NOVISIT
		},
		grouping:'I',
		consiggrouping:'Survivor',
		alignment:'neutral'
	},
	'amnesiac': {
		attributes:  {
			REMEMBER:attributes.REMEMBER,
			DEADTARGET:attributes.DEADTARGET,
			NOLIVINGTARGET:attributes.NOLIVINGTARGET
		},
		grouping:'F',
		consiggrouping:'Amnesiac',
		alignment:'neutral'
	},
	//Custom Roles
	'rain dancer': {
		attributes:  {
			RAINDANCE:attributes.RAINDANCE,
			SELF:attributes.SELF,
			NINJA:attributes.NINJA,
			NOVISIT:attributes.NOVISIT
		},
		grouping:'K',
		consiggrouping:'Rain Dancer',
		alignment:'town'
	},
	'auditor': {
		attributes:  {},
		grouping:'A',
		consiggrouping:'Auditor',
		alignment:'neutral'
	},
	'nightmarer': {
		attributes:  {
			MULTI:attributes.MULTI,
			FORCEDMULTI:attributes.FORCEDMULTI
		},
		grouping:'I',
		consiggrouping:'Nightmarer',
		alignment:'mafia'
	},
	'coroner': {
		attributes:  {
			DEADTARGET:attributes.DEADTARGET,
			NOLIVINGTARGET:attributes.NOLIVINGTARGET
		},
		grouping:'H',
		consiggrouping:'Coroner',
		alignment:'town'
	},
	'watcher': {
		attributes:  {
			WATCH:attributes.WATCH
		},
		grouping:'J',
		consiggrouping:'Watcher',
		alignment:'mafia'
	},
	'electrician': {
		attributes:  {},
		grouping:'L',
		consiggrouping:'Electrician',
		alignment:'neutral'
	},
	'shadowalker': {
		attributes:  {},
		grouping:'J',
		consiggrouping:'Shadowalker',
		alignment:'sw'
	},
	'necromancer': {
		attributes:  {
			DEADTARGET:attributes.DEADTARGET,
			NOLIVINGTARGET:attributes.NOLIVINGTARGET
		},
		grouping:'K',
		consiggrouping:'Necromancer',
		alignment:'neutral'
	},
	'stalker': {
		attributes:  {
			SELF:attributes.SELF
		},
		grouping:'F',
		consiggrouping:'Stalker',
		alignment:'neutral'
	},
	'drug dealer': {
		attributes:  {},
		grouping:'E',
		consiggrouping:'Drug Dealer',
		alignment:'mafia'
	},
	'lost spirit': {
		attributes:  {},
		grouping:'K',
		consiggrouping:'Lost Spirit',
		alignment:'neutral'
	},
	'distributor': {
		attributes:  {
			MULTI:attributes.MULTI,
			FORCEDMULTI:attributes.MULTI
			},
		grouping:'N',
		consiggrouping:'Distributor',
		alignment:'neutral'
	},
	'scientist': {
		attributes:  {},
		grouping:'B',
		consiggrouping:'Scientist',
		alignment:'town'
	},
	'tracker': {
		attributes:  {},
		grouping:'D',
		consiggrouping:'Tracker',
		alignment:'town'
	},
	'tax collector': {
		attributes:  {
			MULTI:attributes.MULTI
		},
		grouping:'B',
		consiggrouping:'Tax Collector',
		alignment:'neutral'
	},
	'ghost': {
		attributes:  {
			RB:attributes.RB,
			RBIMMUNE:attributes.RBIMMUNE
		},
		grouping:'A',
		consiggrouping:'Ghost',
		alignment:'town'
	},
	'paradoxist': {
		attributes:  {},
		grouping:'N',
		consiggrouping:'Paradoxist',
		alignment:'neutral'
	},
	'mystic': {
		attributes:  {},
		grouping:'H',
		consiggrouping:'Mystic',
		alignment:'neutral'
	},
	'mortician': {
		attributes:  {},
		grouping:'H',
		consiggrouping:'Mortician',
		alignment:'neutral'
	},
	'politician': {
		attributes:  {},
		grouping:'D',
		consiggrouping:'Politician',
		alignment:'neutral'
	},
	'undertaker': {
		attributes:  {},
		grouping:'L',
		consiggrouping:'Undetaker',
		alignment:'neutral'
	},
	'orphan': {
		attributes:  {
			NOVISIT:attributes.NOVISIT
		},
		grouping:'G',
		consiggrouping:'Orphan',
		alignment:'neutral'
	},
	'psychic': {
		attributes:  {
			MULTI:attributes.MULTI,
			FORCEDMULTI:attributes.MULTI,
			SELF:attributes.SELF
		},
		grouping:'',
		consiggrouping:'Psychic',
		alignment:'town'
	},
	'interviewer': {
		attributes:  {
			MULTI:attributes.MULTI
		},
		grouping:'',
		consiggrouping:'Interviewer',
		alignment:'town'
	},
	'musician': {
		attributes:  {},
		grouping:'',
		consiggrouping:'Musician',
		alignment:'mafia'
	},
	'cannibal': {
		attributes:  {
			SELF:attributes.SELF,
			MULTI:attributes.MULTI
		},
		grouping:'',
		consiggrouping:'Cannibal',
		alignment:'neutral'
	},
	'spiritualist': {
		attributes:  {
			NOVISIT:attributes.NOVISIT
		},
		grouping:'',
		consiggrouping:'Spiritualist',
		alignment:'town'
	},
};

/* Old Invest Results
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
*/
var investGrouping = {
	'A':'Your target is distracting.',
	'B':'Your target is curious.',
	'C':'Your target seeks justice.',
	'D':'Your target works with secrets.',
	'E':'Your target works with chemicals.',
	'F':'Your target makes rash choices.',
	'G':'Your target thinks about violence.',
	'H':'Your target works with dead bodies.',
	'I':'Your target has dirty hands.',
	'J':'Your target lies in darkness.',
	'K':'Your target works with magic.',
	'L':'Your target talks to oneself.',
	'M':'Your target smells like gas.',
	'N':'Your target owns a golden watch.',
};

var consigResults = {
	'Bodyguard':'Your target owns body armor. They must be a Bodyguard.',
	'Doctor':'Your target owns scrubs and medicine. They must be a Doctor.',
	'Escort':'Your target owns many beautiful dresses. They must be an Escort.',
	'Investigator':'Your target is starting to keep case files on the citizens of this town. They must be an Investigator.',
	'Jailor':'Your target has a prison cell in their basement. They must be the Jailor.',
	'Lookout':'Your target owns binoculars and stalks people with them at night. They must be a Lookout.',
	'Mayor':'Your target has official papers listing them as the leader of this Town. They must be the Mayor.',
	'Medium':'Your target owns a crystal ball and tarot cards. They must be a Medium.',
	'Transporter':'Your target has an expensive, high-tech carriage. They must be a Transporter.',
	'Retributionist':'Your target owns several magical tomes. They must be the Retributionist.',
	'Sheriff':'Your target has hidden away a golden star badge. They must be a Sheriff.',
	'Spy':'Your target has advanced listening and tracking devices. They must be a Spy.',
	'Veteran':'Your target carries a shotgun with them everywhere they go. They must be a Veteran.',
	'Vigilante':'Your target has hidden away a pistol in their bedroom. They must be a Vigilante.',
	'Blackmailer':'Your target has a list of others\' secrets. They muse be a Blackmailer.',
	'Consigliere':'Your target compiles detailed records of other citizen\'s possessions. They must be a Consigliere.',
	'Consort':'Your target owns very expensive jewelry. They must be a Consort.',
	'Disguiser':'Your target owns an elaborate make-up kit. They must be a Disguiser.',
	'Forger':'Your target owns many fancy inks. They must be a Forger.',
	'Framer':'Your target leaves incriminating evidence lying around. They must be a Framer.',
	'Godfather':'Your target is your boss. They must be the Godfather.',
	'Mafioso':'Your target has hidden away several guns. They must be the Mafioso.',
	'Janitor':'Your target owns many cleaning supplies. They must be a Janitor.',
	'Amnesiac':'Your target has records of head trauma. They must be an Amnesiac.',
	'Survivor':'Your target owns only a couple vests from their army days. They must be a Survivor.',
	'Executioner':'Your target owns many pictures of [target], each one crossed out with a red \'X\'. They must be an Executioner.',
	'Jester':'Your target\'s house is full of their deranged, crazy paintings. They must be a Jester.',
	'Witch':'Your target weighs the same as a duck. They must be a Witch.',
	'Arsonist':'Your target owns multiple cans of gasoline. They must be an Arsonist.',
	'Serial Killer':'Your target has an extensive knife collection. They must be a Serial Killer.',
	'Werewolf':'Your target has scratch marks and fur everywhere inside of their home. They must be a Werewolf.',
	'Tracker':'Your target is always following you. They must be a Tracker.',
	'Scientist':'Your target owns vials of blood. They must be a Scientist.',
	'Watcher':'Your target owns binoculars and works with the Mafia, They must be a Watcher.',
	'Electrician':'Your target owns protective vests against high voltage. They must be a Electrician.',
	'Shadowalker':'Your target lurks in the shadows of others, They must be a Shadowalker.',
	'Drug Dealer':'Your target drugs people in the night. They must be a Drug Dealer.',
	'Necromancer':'Your target creates minions. They must be a Necromancer.',
	'Politician':'Your target wants to become the mayor, they must be a Politician.',
	'Nightmarer':'Your target messes with peoples dreams. They must be a Nightmarer.',
	'Undetaker':'Your target buries the dead. They must be a Undertaker.',
	'Lost Spirit':'Your target has long been forgotten. They must be a Lost Spirit.',
	'Orphan':'Your target is living on the streets. They must be a Orphan.',
	'Ghost':'Death did not stop your target from living. They must be a Ghost.',
	'Rain Dancer':'Your target is dancing in the rain. They must be a Rain Dancer.',
	'Auditor':'Your target has immense wealth. They must an Auditor.',
	'Mystic':'Your target has the power to take others\' bodies. They must be a Mystic.',
	'Tax Collector':'Your target collects money from others. They must be a Tax Collector.',
	'Coroner':'Your target gets leads from the dead people. They must be a Coroner.',
	'Paradoxist':'Your target is from another plane of reality. They must be a Paradoxist.',
	'Mortician':'Your target is equipped with a shovel and has experience with gravedigging. They must be a Mortician.',
	'Stalker':'Your target sends cold shivers down your spine. They must be a Stalker.',
	'Distributor':'Your target makes sure everyone is equal. They must be a Distributor.',
	'Psychic':'Your target forms mental links. They must be a Psychic.',
	'Interviewer':'Your target has lots of notes scrunched into his pocket. They must be an Interviewer.',
	'Musician':'Your target plays music for the town. They must be a Musician.',
	'Cannibal':'Your target loves to eat the flesh of others. They must be a Cannibal.',
	'Spiritualist':'You target owns a crystal ball which allows her to read minds. They must be the Spiritualist.'
};

var sheriffResults = {
	'town':'Your target is not suspicious.',
	'mafia':'Your target is a member of the Mafia!',
	'ww': ['Your target is not suspicious.', 'Your target is a Werewolf!'],
	'sw':'Your target is a Shadowalker.',
	'sk':'Your target is a Serial Killer.',
	'arsonist':'Your target is an Arsonist.',
	'neutral':'Your target is not suspicious.'
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
	getRoleGroup:function(role){
		return getRoleGroup(role);
	},
	getInvestFlavor:function(group)
	{
		return investGrouping[group];
	},
	getAlignment:function(role){
		if (autoRoles[role])
		{
			return autoRoles[role].alignment;
		}
		else
		{
			return undefined;
		} 
	},
	getSheriffResult:function(alignment)
	{
		return sheriffResults[alignment];
	},
	getInvestGroupings:function(group){
		return getInvestGroupings(group);
	},
	validTarget:function(arr, role, players, playernames, playernums, self){
		var auto = autoRoles[role];
		if (auto)
		{
			if (auto.attributes.RAINDANCE && rainnumber == 2)
			{
				return 'You can\'t dance right now because it\'s already raining!';
			}
			//Check number of targets
			if (arr.length > 1)
			{
				if (auto.attributes.MULTI)
				{
					
				}
				else
				{
					return 'You can only visit one person at night.';
				}
			}
			else
			{
				if (auto.attributes.FORCEDMULTI) //Has to visit two people.
				{
					return 'You need to visit 2 people with this role. Use /target person1 person2.';
				}
			}
			var selfVisiting = false;
			for (i in arr)
			{
				if (!isNaN(arr[i]))
				{
					arr[i] = players[playernums[arr[i]]].name;
				}
				if (arr[i] == self.name)
				{
					selfVisiting = true;
				}
			}
			if (selfVisiting)
			{
				if (auto.attributes.SELF)
				{
					
				}
				else
				{
					return 'You tried to self target, but your role cannot self target.';
				}
			}
			else
			{
				if (auto.attributes.NOVISIT)
				{
					return 'You tried to target another player, but your role can only self target.';
				}
			}
		} 
		else
		{
			return 'notfound';
		}
		return 'ok';
	},
	setDay:function(num){
		daynumber = num;
	},
	getDay:function(){
		return daynumber;
	},
	getActions:function(name){
		return loggedActions[name];
	},
	grammarList:function(list, sep){
		if (sep === undefined)
		{
			sep = 'and';
		}
		//Format a list in a grammatically correct way.
		var str = '';
		if (list.length > 1)
		{
			str = list.slice(0,list.length-1).join(', ') + ' '+sep+' ' + list[list.length -1];
		}
		else if (list.length == 1)
		{
			str = list[0];
		}
		return str;
	},
	evaluate:function(players, playernames, mod, roles, lvl, fromphase){
		var targets = {};
		var displayTargets = {};
		var playersByName = {}; //Quick target array to get back to the players array.
		//Populate targets array.
		for (i in players)
		{
			if (mod != players[i].s.id)
			{
				playersByName[players[i].name] = players[i];//Quicktarget
				targets[players[i].name] = [players[i].role,undefined, true];
				if (players[i].alive)
				{
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
		//Only do this bit if suggestions are enabled ie. auto is 2
		if (lvl == 2)
		{
			//Sort targets array by priority
			var orderedTargets = Object.keys(targets);
			orderedTargets = orderedTargets.sort(function(one, two){
				var rolename1 = getRole(targets[one]);
				var rolename2 = getRole(targets[two]);
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
			if (rainnumber == 1 && fromphase == 4 || fromphase == 7)
			{
				addSuggestedMessage('It started to rain.','<All>');
				rainnumber = 2;
			}
			else if (rainnumber == 2)
			{
				var drstring = "";
				for (i in orderedTargets)
				{
				var num = orderedTargets[i];
				var role = getRole(targets[num]);
				var roleInfo = autoRoles[role];
				var roleAttributes = roleInfo.attributes;
				if (roleAttributes.NINJA || roleAttributes.NOLIVINGTARGET || targets[players[i].[name][1] != [])
				{
					
				}
				else
				{
					drstring += " "+num;
				}
				}
				drstring = drstring.substr(1);
				var drlist = drstring.split(" ");
				addSuggestedMessage('Those people got drenched tonight: '+drlist,'<All>');
				rainnumber = 0;
			}
			//Loop through roles in priority order.
			for (i in orderedTargets)
			{
				var num = orderedTargets[i];
				var role = getRole(targets[num]);
				var roleInfo = autoRoles[role];
				if (roleInfo) //If role is automated
				{
					if (targets[num][1])
					{
						if( Object.keys(targets[num][1]).length != 0 || roleInfo.attributes.MUSTVISIT || (roleInfo.attributes.MUSTVISITEVEN && daynumber % 2 == 0)) //If they sent in a night action or have to visit anyway
						{
							if (Object.keys(targets[num][1]).length == 0) //If they were forced they must now target themselves.
							{
								targets[num][1].push(num);
							}
							var roleAttributes = roleInfo.attributes;
							var targettingLiving = false;
							var targettingDead = false;
							for (j in targets[num][1])
							{
								var p = playersByName[targets[num][1][j]];
								if (p.alive)
								{
									targettingLiving = true;
								}
								else
								{
									targettingDead = true;
								}
							}
							var allowedDead = roleAttributes.DEADTARGET;
							var allowedLiving = !roleAttributes.NOLIVINGTARGET;
							//TargettingLiving is true if at least one target is alive. TargettingDead is true if at least one is dead.
							var valid = false;
							if (targettingDead)
							{
								if (allowedDead)
								{
									valid = true;
								}
								else
								{
									valid = false;
									displayTargets[num][2] = {auto:false,reason:'Targetting a dead player when not allowed.'}; //Set the role to not automated.
									addSuggestedMessage('Your night action was disregarded because you targetted a dead player, when your role cannot target the dead.',num);
								}
							}
							else
							{
								if (allowedLiving)
								{
									valid = true;
								}
								else
								{
									valid = false;
									displayTargets[num][2] = {auto:false,reason:'Targetting a living player when not allowed.'}; //Set the role to not automated.
									addSuggestedMessage('Your night action was disregarded because you targetted a living player, when your role cannot target the living.',num);
								}
							}
							if (roleAttributes.NOVISIT && targets[num][1][0] != num)
							{
								valid = false;
								addSuggestedMessage('Your night action was disregarded because you targetted another player, when your role can only self target.',num);
							}
							if (valid)
							{
								if (isLegalTarget(num,roleAttributes,targets))
								{
									if (roleAttributes.TRANSPORT) //Transport
									{
										//Ensure two targets were used.
										var t = targets[num][1];
										if (t.length == 2 )
										{
											var player = players[playernames[t[0]]];
											var player2 = players[playernames[t[1]]];
											if (!player.chats.jailed && !player2.chats.jailed ) //Check if either player was jailed
											{
												//Swap all targets on the two players.
												for (j in targets)
												{
													for (k in targets[j][1])
													{
														if (targets[j][1][k] == t[0] && j != num)
														{
															var index = k;
															//Remove the previous target.
															var prevTarget = targets[j][1][0];
															var pindex = beingTargetted[prevTarget].indexOf(j);
															beingTargetted[prevTarget].splice(pindex,1);
															//This person targetted one of the players being transported. Switch them to the other one.
															targets[j][1][index] = t[1];
															displayTargets[j][3].push('transport');
															//Add a variable allowing them to self target now.
															targets[j][3] = true;
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
														else if (targets[j][1][k] == t[1] && j != num)
														{
															var index = k;
															//Remove the previous target.
															var prevTarget = targets[j][1][0];
															var pindex = beingTargetted[prevTarget].indexOf(j);
															beingTargetted[prevTarget].splice(pindex,1);
															//This person targetted one of the players being transported. Switch them to the other one.
															targets[j][1][index] = t[0];
															displayTargets[j][3].push('transport');
															//Add a variable allowing them to self target now.
															targets[j][3] = true;
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
											}
											else
											{
												//Inform transporter and cancel action.
												addSuggestedMessage('One of your targets was in jail, so you could not transport them!',num);
											}
										}
										else
										{
											displayTargets[num][2] = {auto:false,reason:'Incorrect number of targets.'}; //Set the role to not automated.
											addSuggestedMessage('Your night action was disregarded because you targetted an incorrect number of players.',num);
										}
									}
									else if (roleAttributes.CONTROL) //Witching
									{
										//Remove the 
										var t = targets[num][1].slice(); //Duplicate the array
										//Ensure two targets were used.
										if (t.length == 2 )
										{
											//Remove the second target, witch doesn't 'visit' it.
											targets[num][1].splice(1);
											var index = beingTargetted[t[1]].indexOf(num);
											beingTargetted[t[1]].splice(index,1);
											var person = targets[t[0]];
											var personRole = getRole(person);
											if (autoRoles[personRole] && autoRoles[personRole].attributes.CONTROLIMMUNE)
											{
												//Inform the person being controlled of the failure.
												addSuggestedMessage('A witch tried to control you, but you are immune!',t[0]);
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
												targets[t[0]][3] = true;
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
											displayTargets[num][2] = {auto:false,reason:'Incorrect number of targets.'}; //Set the role to not automated.
											addSuggestedMessage('Your night action was disregarded because you targetted an incorrect number of players.',num);
										}
									}
									else if (roleAttributes.RB) //Roleblocking
									{
										var t = targets[num][1];
										var person = targets[t[0]];
										var personRole = getRole(person);
										//If the person is not immune to roleblocking
										if (autoRoles[personRole] && autoRoles[personRole].attributes.RBIMMUNE)
										{
											//Inform the person of the failure.
											addSuggestedMessage('Someone tried to roleblock you, but you are immune.',t[0]);
										}
										else
										{
											if (autoRoles[personRole] && autoRoles[personRole].attributes.RBATTACK)
											{
												displayTargets[t[0]][3].push('rbattack');
												var prevTarget = targets[t[0]][1];
												//Remove the reference to the previous target.
												if (prevTarget.length > 0)
												{
													var index = beingTargetted[prevTarget].indexOf(t[0]);
													beingTargetted[prevTarget].splice(index,1);
												}
												//Remove target
												targets[t[0]][1] = [];
												addSuggestedMessage("You were attacked by the Serial Killer you visited!",num);
												addSuggestedMessage("Someone roleblocked you, so you attacked them!",t[0]);
												if (isHealed(num,targets))
												{
													var doc = isHealed(num,targets);
													addSuggestedMessage('You were attacked but someone nursed you back to health!',num);
													/*addSuggestedMessage('Your target was attacked last night.',doc);*/
												}
												else
												{
													addSuggestedAction('Kill',num);
													addSuggestedMessage('They were killed by a [sk]Serial Killer[/sk]','<All>');
												}
											}
											else if (autoRoles[personRole] && autoRoles[personRole].attributes.RBHOME && daynumber % 2 == 0)
											{
												var prevTarget = targets[t[0]][1];
												//Remove the reference to the previous target.
												if (prevTarget.length > 0)
												{
													var index = beingTargetted[prevTarget].indexOf(t[0]);
													beingTargetted[prevTarget].splice(index,1);
												}
												//Remove target
												targets[t[0]][1] = [];
												addSuggestedMessage("Someone roleblocked you, so you stayed home.",t[0]);
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
													addSuggestedMessage('You died protecting your target.',num); //Tell bg that they succeeded
													//Suggested actions: Kill both the bg and attacker
													addSuggestedAction('Kill', num);
													addSuggestedAction('Kill', visitors[j]);
													//Death announcements
													addSuggestedMessage('They died guarding someone.','<All>');
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
												if ((attrib.MAFKILL || attrib.VIGKILL || attrib.MAUL || attrib.SKKILL) && isLegalTarget(visitors[j],autorole.attributes,targets))
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
										for (j in peopleTargetting) //Loop through and check for heals
										{
											var person = targets[peopleTargetting[j]];
											var role = getRole(person);
											if (autoRoles[role])
											{
												var attrib = autoRoles[role].attributes;
											}
											if (attrib && attrib.HEAL && isLegalTarget(peopleTargetting[j],attrib,targets))
											{
												//Person was healed, attack fails silently.
												attackSuccess = false;
											}
											else if (attrib && attrib.BG && isLegalTarget(peopleTargetting[j],attrib,targets))
											{
												//More complicated, attack only fails if this is the person the bg killed.
												if (person.bgKill == num)
												{
													attackSuccess = false;
												}
											}
										}
										//Check for night immunity or vet alerting.
										var role = getRole(targets[t[0]]);
										var target = players[playernames[t[0]]];
										
										if (autoRoles[role] && (autoRoles[role].attributes.IMMUNE || (autoRoles[role].attributes.VEST && Object.keys(targets[t[0]][1]).length != 0) ) )
										{
											if (attrib && person.bgKill == num && attrib.BG && isLegalTarget(peopleTargetting[j],attrib,targets))
											{
												//Attack failed
											}
											else
											{
												//Immune or a survivor that sent in an action.
												attackSuccess = false;
												//Inform the person they were attacked, inform the attacker their target was immune.
												addSuggestedMessage('You were attacked, but you are immune at night!',t[0]);
												addSuggestedMessage('Your target was immune to your attack!',num)
											}
										}
										else if (autoRoles[role] && autoRoles[role].attributes.ALERT) //Vet alert.
										{
											if (Object.keys(targets[t[0]][1]).length != 0) //If alerting
											{
												attackSuccess = false;
												addSuggestedMessage('Someone tried to kill you, but you cannot be killed while on alert!',t[0]);
											}
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
											//Werewolf check
											role = getRole(targets[t[0]]);
											if (autoRoles[role].attributes.FULLMOONSHERIFFRESULT)
											{
												var number = 1 - (daynumber % 2); //Minus to make it so that odd is first.
												msg = sheriffResults[alignment][number];
											}
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
										//Remove ninja roles
										for (p in visitors)
										{
											var player = players[playernames[visitors[p]]];
											var autorole = autoRoles[player.role];
											if (autorole)
											{
												if (autorole.attributes.NINJA)
												{
													visitors.splice(p,1);
												}
											}
										}
										//Grammar
										var str = this.grammarList(visitors);
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
											for (j in visitors)
											{
												var name = visitors[j];
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
										role = autoRoles[role];
										var group = role.consiggrouping;
										var results = consigResults[group];
										if (false)
										{
										addSuggestedMessage("Your target is a "+capitalize(role)+'.',num);
										}
										else
										{
										addSuggestedMessage(results,num);
										}
									}
									else if (roleAttributes.CLEAN) //Role cleaning
									{
										var t = targets[num][1];
										if (isDying(t[0],targets))
										{
											addSuggestedAction('Clean',t[0]);
											addSuggestedAction('Set Role',t[0]+"/cleaned");
										}
									}
									else if (roleAttributes.REMEMBER) //Remembering a role
									{
										var t = targets[num][1];
										var p = playersByName[t[0]];
										addSuggestedAction('Set Role',num+"/"+p.role);
										var a = AorAn(p.role);
										addSuggestedMessage('An Amnesiac has remembered that they were '+a+' '+p.role+".",'<All>');
										addSuggestedMessage('You remembered what you were!',num);
									}
									else if (roleAttributes.RAINDANCE)
										if (rainnumber == 0)
										{
											addSuggestedMessage('It seems like its going to rain tonight.','<All>');
											rainnumber = 1;
										}
									else if (roleAttributes.REVIVE)
									{
										var t = targets[num][1];
										addSuggestedAction('Revive',t[0]);
										addSuggestedMessage('They were revived by a [town]Retributionist[/town].','<All>');
										addSuggestedMessage('You successfully revived your target!',num);
										addSuggestedMessage('You were revived by a Retributionist!',t[0]);
									}
									else if (roleAttributes.EXECUTE)
									{
										if (fromphase == 8)
										{
											var t = targets[num][1];
											addSuggestedMessage('They were executed by the [town]Jailor[/town].','<All>');
											addSuggestedAction('Kill',t[0]);
										}
										else
										{
											var t = targets[num][1];
											addSuggestedAction('Jail',t[0]);
										}
									}
									else if (roleAttributes.ALERT)
									{
										var visitors = getPeopleTargetting(num);
										for (j in visitors)
										{
											if (visitors[j] != num)
											{
												var success = true;
												var vVisitors = getPeopleTargetting(visitors[i]);
												for (k in vVisitors) //Check for a doc heal
												{
													var role = getRole(targets[vVisitors[k]]);
													if (autoRoles[role])
													{
														var attribs = autoRoles[role].attributes;
														if (attribs.HEAL)
														{
															success = false;
															//Successful heal!
															addSuggestedMessage('You were attacked but someone nursed you back to health!',visitors[j]);
															addSuggestedMessage('Your target was attacked last night.',vVisitors[k]);
														}
													}
												}
												if (success)
												{
													addSuggestedMessage('They were shot by a [town]Veteran[/town].','<All>');
													addSuggestedAction('Kill',visitors[j]);
												}
												addSuggestedMessage('You shot someone that visited you.',num);
												addSuggestedMessage('You were shot by the veteran you visited.',visitors[j]);
											}
										}
									}
									else if (roleAttributes.MAUL)
									{
										if (daynumber % 2 == 0 && fromphase == 8 /*Night*/)
										{
											if (targets[num][1].length > 0)
											{
												var t = targets[num][1];
											}
											else
											{
												var t = [num];
											}
											var visitors = getPeopleTargetting(t[0]);
											var bgd= false;
											var rbd = false;
											for (v in visitors)
											{
												var r = getRole(targets[visitors[v]]);
												if (autoRoles[r])
												{
													var att = autoRoles[r].attributes;
													if (att.BG)
													{
														bgd = true;
													}
												}
											}
											var jailed = players[playernames[t[0]]].chats.jailed;
											if (t[0] != num && !jailed && !bgd)
											{
												visitors.push(t[0]); //Person that ww is targetting gets mauled as well
											}
											else if (jailed)
											{
												for (w in players)
												{
													if (players[w].chats.jailor)
													{
														visitors.push(players[w].name);
													}
												}
											}
											for (j in visitors)
											{
												if (visitors[j] != num)
												{
													var success = true;
													//Check for doc heal
													if (isHealed(visitors[j],targets))
													{
														//Successful heal!
														success = false;
													}
													if (success)
													{
														addSuggestedMessage('They were mauled by a [ww]Werewolf[/ww].','<All>');
														addSuggestedAction('Kill',visitors[j]);
														addSuggestedMessage('You were mauled by a Werewolf!',visitors[j]);
													}
													addSuggestedMessage('You attacked someone.',num);
												}
											}
										}
										else
										{
											addSuggestedMessage('Your night action was disregarded because you can only attack on Full Moon.',num);
										}
									}
									else if (roleAttributes.DISGUISE)
									{
										var t = targets[num][1];
										if (isDying(t[0],targets) )
										{
											addSuggestedAction('Disguise',num+'/'+t[0]);
										}
									}
								}
								else
								{
									displayTargets[num][2] = {auto:false,reason:'Player is self-targetting, but role cannot self target.'}; //Set the role to not automated.
									addSuggestedMessage('Your night action was disregarded because you self-targetted, when your role cannot self-target.',num);
								}
							}
						}
						else
						{
							var roleAttributes = roleInfo.attributes;
							if (roleAttributes.PASSIVE) //If they have a passive night action.
							{
								if (roleAttributes.MAFVISIT) //Sees who mafia visits, if not roleblocked.
								{
									var blocked = false;
									var visits = [];
									for (j in players)
									{
										if (players[j].chats.mafia)
										{
											var name = players[j].name;
											if (Object.keys(targets[name][1]).length != 0) //if they sent in a night action
											{
												visits = visits.concat(targets[name][1]);
											}
										}
									}
									var peopleTargettingMe = getPeopleTargetting(num);
									for (j in peopleTargettingMe)
									{
										var role = getRole( targets[peopleTargettingMe[j]] );
										var attribs = autoRoles[role].attributes;
										if (attribs.RB)
										{
											blocked = true;
										}
									}
									//Grammar
									var str = '';
									str = "The mafia visited "+this.grammarList(visits)+".";
									if (visits.length > 0 && !blocked)
									{
										addSuggestedMessage(str,num);
									}
								}
							} 
						}
					}
					else
					{
						if (displayTargets[num])
						{
							displayTargets[num][2] = {auto:false,reason:'Role not in system.'}; //Set the role to not automated.
						}
					}
				}
			}
		}
		//Return array of messages to send and actions to take.
		if (lvl > 1)
		{
			return {
				targets: displayTargets,
				messages: suggestedMessages,
				actions: suggestedActions,
				phase: fromphase
			}
		}
		else
		{
			return {
				targets: displayTargets
			}
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
	if (person)
	{
		return (person[0].toLowerCase());
	}
}
function getPeopleTargetting(name)
{
	if (name)
	{
		if (beingTargetted[name])
		{
			return (beingTargetted[name].slice(0,beingTargetted[name].length));
		}
		else
		{
			return [];
		}
	}
	else
	{
		console.log('ERROR: Undefined value passed to getPeopleTargetting.');
		return undefined;
	}
}
function getRoleGroup(role)
{
	if (autoRoles[role])
	{
		return autoRoles[role].grouping;
	}
	else
	{
		return '';
	}
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
function getConsigGroupings(consiggrouping)
{
	var arr = [];
	for (i in autoRoles)
	{
		if (autoRoles[i].consiggrouping == consiggrouping)
		{
			arr.push(capitalize(i));
		}
	}
	return arr;
}
function isDying(name,targets)
{
	var visitors = getPeopleTargetting(name);
	for (j in visitors)
	{
		var name = visitors[j];
		var role = getRole(targets[name]);
		var autorole = autoRoles[role];
		if (autorole !== undefined)
		{
			var attrib = autorole.attributes;
			if (attrib.MAFKILL || attrib.VIGKILL || attrib.MAUL || attrib.SKKILL || attrib.EXECUTE) //Killing roles.
			{
				if (isLegalTarget(name,attrib,targets))
				{
					return true;
				}
			}
		}
	}
	//Check who name is targetting, for vet/ww
	var t = targets[name];
	for (j in t[1])
	{
		var r = getRole(t[1][j]);
		var ar = autoRoles[role];
		if (ar.attributes.ALERT) //If they're a veteran.
		{
			if (Object.keys(targets[t[1][j]][1]).length != 0)//If they are alerting.
			{
				if (!isHealed(name,targets)) //If a doc isn't healing this person.
				{
					return true;
				}
			}
		}
	}
}
function isLegalTarget(name,roleAttributes,targets)								
{
	//If they are not self targetting, or are allowed to self target anyway. 
	//Exception variable for witches and transporters.
	return (targets[name][1] != name || roleAttributes.SELF || targets[name][3]);
}
function isHealed(name,targets)
{
	var peopleTargetting = getPeopleTargetting(name);
	for (j in peopleTargetting) //Loop through and check for heals
	{
		var person = targets[peopleTargetting[j]];
		var role = getRole(person);
		var attrib = autoRoles[role].attributes;
		if (attrib.HEAL)
		{
			//Person was healed
			return peopleTargetting[j];
		}
	}
	return false;
}
//String stuff
function capitalize(str)
{
	var arr = str.split(' ');
	for (i in arr)
	{
		arr[i] = arr[i][0].toUpperCase() + arr[i].substring(1,arr[i].length)
	} 
	return arr.join(' ');
}
function AorAn(word)
{
	var first = word[0].toLowerCase();
	if ('aeiou'.indexOf(first) != -1)
	{
		return 'an';
	}
	else
	{
		return 'a';
	}
}
