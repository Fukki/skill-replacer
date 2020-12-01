module.exports = function skillReplacer(mod) {
	const fs = jsonRequire('fs'), path = jsonRequire('path');
	const cmd = mod.command || mod.require.command;
	let lastSkill = null, repeatSkill = null, gameId = null, job = 0;
	let config = getConfig();
	
	cmd.add(['reskill', 'rs'], (arg1) => {
		if(arg1 && arg1.length > 0) arg1 = arg1.toLowerCase();
		switch (arg1) {
			case 're':
			case 'load':
			case 'reload':
				config = getConfig();
				cmd.message('Skill Replacer: Config.json has been reloaded.');
				break;
			case 'on':
				setEnabled(true);
				break;
			case 'off':
				setEnabled(false);
				break;
			default:
				cmd.message(`Wrong commands :v`);
				break;
		}
	});
	
	mod.hook('S_LOGIN', 12, e => {
		gameId = e.gameId;
		job = (e.templateId - 10101) % 100;
	});
	
	mod.hook('C_START_SKILL', 7, {order: -999999999, filter: {fake: null}}, e => {
		let s = config.replaceList[job] ? config.replaceList[job][Math.floor(e.skill.id / 10000)] : null;
		lastSkill = e;
		if (config.enabled && s && s.enabled) {
			if (!repeatSkill && s.autoRepeat) {
				repeatSkill = s.replace2Skill;
			}
			e.skill.id = s.replace2Skill;
			return true;
		} else if (lastSkill) {
			lastSkill = null;
		}
	});
	
	mod.hook('S_ACTION_END', 5, {order: -999999999, filter: {fake: null}}, e => {
		if (config.enabled && gameId === e.gameId) {
			if (lastSkill && repeatSkill === e.skill.id)
				mod.toServer('C_START_SKILL', 7, {
					skill: repeatSkill,
					loc: lastSkill.loc,
					w: lastSkill.w,
					dest: lastSkill.dest,
					unk: lastSkill.unk,
					moving: lastSkill.moving,
					continue: lastSkill.continue,
					target: lastSkill.target,
					unk2: lastSkill.unk2
				});
			else if (repeatSkill)
				repeatSkill = null;
		}
	});
	
	function setEnabled(e) {
		config.enabled = e;
		cmd.message(`Skill Replacer: ${e ? 'Enable' : 'Disable'}.`);
		jsonSave('config.json', config);
	}
	
	function getConfig() {
		let d = {};
		try {
			d = jsonRequire('./config.json');
		} catch (e) {
			d = {
				enabled: true,
				replaceList: {
					"JOB ID": {
						"Skill ID with Floor(ID/10000)": {
							enabled: true,
							Description: "Just noted",
							replace2Skill: "Full skill id for replace",
							autoRepeat: false
						}
					}
				}
			}
			jsonSave('config.json', d);
		}
		return d;
	}
	
	function jsonRequire(e) {
		delete require.cache[require.resolve(e)];
		return require(e);
	}
	
	function jsonSave(name, d) {fs.writeFile(path.join(__dirname, name), JSON.stringify(d, null, 4), err => {});}
}