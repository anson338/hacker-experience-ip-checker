// ==UserScript==
// @name         HE IP Checker
// @namespace    HEIPChecker
// @version      1.1.0
// @description  HE IP Checker is a little userscript that checks IP addresses for their types and if they exist. You can do a maximum of 2,500 IP's at once (to prevent IP brute-forcing). It injects into the breadcrumb bar, and the input window opens when you click the link the 'Check IP's' link just beneath where your bank money is shown.
// @author       Jasper van Merle
// @match        https://legacy.hackerexperience.com/*
// @match        https://en.hackerexperience.com/*
// @match        https://br.hackerexperience.com/*
// @updateURL    https://github.com/anson338/hacker-experience-ip-checker/master/HEIPChecker.meta.js
// @downloadURL  https://github.com/anson338/hacker-experience-ip-checker/master/HEIPChecker.user.js
// @grant        none
// ==/UserScript==

const ISP_IP = '195.153.108.51';


class Utils{
    constructor(){
        this.isGritterLoaded = false;
    }
    
    static notify(title, message) {
        if (!this.isGritterLoaded) {
            $('<link rel="stylesheet" type="text/css" href="css/jquery.gritter.css">').appendTo('head');
            $.getScript('js/jquery.gritter.min.js', () => {
                $.gritter.add({
                    title,
                    text: message,
                    image: '',
                    sticky: false
                });
            });
            this.isGritterLoaded = true;
            return;
        }
        $.gritter.add({
            title,
            text: message,
            image: '',
            sticky: false
        });
    }
    
    getParameterByName(name) {
        name = name.replace(/[\[\]]/g, '\\$&');
        const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
        const results = regex.exec(window.location.href);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }
    
    static validateIP(ipAddress) {
        if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipAddress) && ipAddress !== ISP_IP) {
            return true;
        }
        return false;
    };

    
    isLoggedIn() {
        return $('a[href="logout"]').length > 0;
    }
    
    isOnPage(page) {
        return window.location.pathname === page;
    }
}

class Checker{
    constructor(){
        this.linkToInject = `<span class="pull-right hide-phone"><a href="javascript:void(0)" id="ipCheckLink">Check IP\'s</a></span>`;
        this.inputModal = `<div class="fade modal"role=dialog id=inputModal tabindex=-1>
                                <div class=modal-dialog role=document><div class=modal-content>
                                    <div class=modal-header>
                                        <button class=close type=button data-dismiss=modal aria-label=Close>
                                            <span aria-hidden=true>×</span>
                                        </button>
                                        <h4 class=modal-title>HE IP Checker by <a href="https://legacy.hackerexperience.com/profile?id=510033"target=_blank>Jasperr</a> (1.1.2?)</h4>
                                    </div>
                                    <form id=inputForm>
                                        <div class=modal-body>
                                            <div class=form-group>
                                                <label class=control-label for=ipInput>Please input your IP's or logs below and it will give you back all existing VPC's and Clan IP's.</label>
                                                <textarea class=form-control id=ipInput placeholder="Place your IP's or logs here"rows=10 style=min-width:90%></textarea>
                                            </div>
                                        </div>
                                    <div class=modal-footer>
                                        <button class="btn btn-default"type=button data-dismiss=modal>Close</button> 
                                        <button class="btn btn-primary"type=submit id=inputSubmitButton>Check my IP's</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>`;
        this.isChecking = false;
        this.totalChecked = 0;
        this.totalIPsToCheck = 0;
        this.nonExisting = 0;
        this.errors = 0;
        this.NPCs = [];
        this.VPCs = [];
        this.ClanServers = [];
        this.IPsToCheck = [];
        this.currentIP = undefined;
    }
        
    static ipCheckLinkClick() {
        $('#inputModal').modal('show');
        $('.modal-backdrop').removeClass('modal-backdrop');
    }
    
    bindLinkEvent() {
        $('#ipCheckLink').on('click', event => {
            Checker.ipCheckLinkClick();
        });
    }
    
    checkIPs(ipArray) {
        if (!this.isChecking) {
            this.isChecking = true;
            this.totalChecked = 0;
            this.nonExisting = 0;
            this.errors = 0;
            this.NPCs = [];
            this.VPCs = [];
            this.ClanServers = [];

            this.totalIPsToCheck = ipArray.length;
            this.IPsToCheck = ipArray;

            $('#inputSubmitButtonAmountTotal').text(this.totalIPsToCheck);

            this.checkIPArray();
        }
    }
    
   checkIPArray() {
       if (this.isChecking) {
           if (this.totalChecked === this.totalIPsToCheck) {
               $.get(`${window.location.origin}/internet?ip=${this.currentIP}`).always(() => {
                   this.finishSubmit();
               });
               return;
           }

           const ip = this.IPsToCheck[0];
           this.IPsToCheck.splice(0, 1);

           $.get(`${window.location.origin}/internet?ip=${ip}`).done((data) => {
                   if ($('.widget-content:contains("404")', data).length) {
                       this.nonExisting++;
                   } else {
                       switch ($('.label.pull-right', data).text()) {
                           case 'NPC':
                               this.NPCs.push(ip);
                               break;
                           case 'VPC':
                               this.VPCs.push(ip);
                               break;
                           case 'Clan Server':
                               this.ClanServers.push(ip);
                               break;
                           default:
                               this.NPCs.push(ip);
                       }
                   }
               }).fail(() => {
                   this.errors++;
               }).always(() => {
                   this.totalChecked++;
                   this.checkIPArray();
                   $('#inputSubmitButtonAmountDone').text(this.totalChecked);
               });
       }
   }
   
    submitInput() {
        $('#inputSubmitButton').prop('disabled', true);
        $('#inputSubmitButton').html('Working on it (<span id="inputSubmitButtonAmountDone">0</span>/<span id="inputSubmitButtonAmountTotal">0</span>)');

        const validIPs = [...new Set($('#ipInput').val().match(/(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/g))].filter(Utils.validateIP);

        if (validIPs.length == 0) {
            Utils.notify('HE IP Checker', 'You didn\'t input any IP\'s or all your IP\'s were invalid or you only put in the ISP IP which doesn\'t get checked.');

            $('#inputSubmitButton').prop('disabled', false);
            this.isChecking = false;
            $('#inputSubmitButton').text(`Check my IP's`);
            this.bindLinkEvent();

            return;
        }

        if (validIPs.length > 2500) {
            Utils.notify('HE IP Checker', `You can only check 2500 IP's at a time.`);

            $('#inputSubmitButton').prop('disabled', false);
            isChecking = false;
            $('#inputSubmitButton').text(`Check my IP's`);
            this.bindLinkEvent();

            return;
        }

        this.checkIPs(validIPs);
    }
  
    finishSubmit() {
        var text = `Checked ${this.totalIPsToCheck} IP's of which ${this.nonExisting} didn't exist ${this.errors} errors occurred).
        There were ${this.NPCs.length} NPC's, ${this.VPCs.length} VPC's and ${this.ClanServers.length} Clan servers.`;
        if (this.NPCs.length > 0) {
            text += `\n\nNPC IP's (${this.NPCs.length})\n\n`;
            text += this.NPCs.join('\n');
        }
        if (this.VPCs.length > 0) {
            text += `\n\nVPC IP's (${this.VPCs.length})\n\n`;
            text += this.VPCs.join('\n');
        }
        if (this.ClanServers.length > 0) {
            text += `\n\nClan Server IP's (${this.ClanServers.length})\n\n`;
            text += this.ClanServers.join('\n');
        }

        $('#ipInput').val(text);
        $('#inputSubmitButton').prop('disabled', false);
        this.isChecking = false;
        $('#inputSubmitButton').html('Check my IP\'s');
        this.bindLinkEvent();
    }
}





$(document).ready(() => {
    const utils = new Utils();
    const checker = new Checker();
    if (utils.isLoggedIn()) {
        $('#breadcrumb').append(checker.linkToInject);
        $('body').append(checker.inputModal);

        $('#inputForm').submit(event => {
            event.preventDefault();
            checker.submitInput();
        });

        if (utils.isOnPage('/internet') && utils.getParameterByName('ip') && utils.validateIP(utils.getParameterByName('ip'))) {
            checker.currentIP = checker.getParameterByName('ip');
        } else {
            checker.currentIP = '1.2.3.4';
        }

        checker.bindLinkEvent();
    }
});
