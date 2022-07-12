const prompts = require('prompts');
const fs = require('fs');
const ini = require('ini');
const os = require('os');

var fn_cred = `${os.homedir()}/.aws/credentials`;
var fn_config = `${os.homedir()}/.aws/config`;

// Get profiles with specific key
// fn - File name to read
// key - Key within section. If key is present section is added to output
function get_profiles(fn, key) {
	var sections = [];
	const config = ini.parse(fs.readFileSync(fn, 'utf-8'));
	Object.keys(config).forEach(profile => {
		const cred = config[profile];
		if (Object.prototype.hasOwnProperty.call(cred, key)) {
			sections.push({ title: profile, value: profile });
		}
	}
	);
	return sections;
}
// Get sections from .aws/config file with key mfa_arn
var no_mfa_sections = get_profiles(fn_config, 'mfa_arn');
// Get sections from credentials file with key aws_session_token
var mfa_sections = get_profiles(fn_cred, 'aws_session_token');
// CLI prompt definition
const aws_profiles = [
	{
		type: 'select',
		name: 'no_mfa_profile',
		message: 'Select non MFA profile',
		choices: no_mfa_sections,
		initial: 0
	},
	{
		type: 'select',
		name: 'mfa_profile',
		message: 'Select MFA profile',
		choices: mfa_sections,
		initial: 0
	},
	{
		type: 'text',
		name: 'token',
		message: 'Enter token:'
	}
];
(async () => {
	const response = await prompts(aws_profiles);
	console.log(`No MFA profile:${response.no_mfa_profile.substring('profile '.length)}, MFA profile:${response.mfa_profile}, Token:${response.token}`);
	// Get MFA device ARN from .aws/config file
	const cfg = ini.parse(fs.readFileSync(fn_config, 'utf-8'));
	// If mfa_arn key not present in section, cmd will fail
	const arn = cfg[response.no_mfa_profile].mfa_arn;
	// aws sts get-session-token --profile no-mfa --serial-number arn --token-code response.token
	const cmd = `aws sts get-session-token --profile ${response.no_mfa_profile.substring('profile '.length)} --serial-number ${arn} --output json --token-code ${response.token}`;
	console.log(`Executing:${cmd}`);

	// Run aws sts cmd and parse stdout output
	const { exec } = require('child_process');
	exec(cmd, (error, stdout, stderr) => {
		if (error) {
			console.log(error)
		} else if (stdout) {
			console.log("stdout:\n" + stdout)
			// Parse output
			const obj = JSON.parse(stdout);
			// Save output
			const cred = ini.parse(fs.readFileSync(fn_cred, 'utf-8'));
			cred[response.mfa_profile].aws_access_key_id = obj.Credentials.AccessKeyId;
			cred[response.mfa_profile].aws_secret_access_key = obj.Credentials.SecretAccessKey;
			cred[response.mfa_profile].aws_session_token = obj.Credentials.SessionToken;
			cred[response.mfa_profile].expires = obj.Credentials.Expiration;
			fs.writeFileSync(fn_cred, ini.stringify(cred));
		}
		else {
			console.log(stdout, stderr)
		}
	});

})();
