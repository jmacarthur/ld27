#!/usr/bin/perl
use CGI;
use Data::Dumper;
use DBI;
use utils;

# POST to this - user ID

open STDERR, ">>errors" if $ENV{SERVER_SOFTWARE} =~ m/^mini_httpd/;

my $dbh = DBI->connect("dbi:SQLite:../condition.sqlite","","");

my $q = CGI->new;
my $data = $q->param('POSTDATA');
if(!defined($data)) { $data = $q->param('XForms:Model'); }
if(!defined($data)) { $data = $q->param('u'); }

my $userID = $data+0;

print $q->header('text/plain');
print "Hello user $userID.\n";

sub getUserShard
{
    my $userID = shift;
    my $sth = $dbh->prepare("SELECT shard from userids where userid=?");
    my $rh = $sth->execute($userID);
    my @array = $sth->fetchrow_array();
    if(@array>0) {
        return $array[0];
    }
    return 0;
}

sub getShardUser
{
    my $shardID = shift;
    my $sth = $dbh->prepare("SELECT nextuser from shard where shardid=?");
    my $rh = $sth->execute($shardID);
    my @array = $sth->fetchrow_array();
    if(@array>0) {
        return $array[0];
    }
    return -1;
}

sub sendStartupInfo
{
    my $shardID = shift;
    # We need to block this shard until we get the results back.
    # Need an 'in use' flag.
    my $sth = $dbh->prepare("UPDATE shard set inuse=1 WHERE shardid=?");
    my $rh = $sth->execute($shardID);
    $sth = $dbh->prepare("SELECT playerx,playery,time,flags,mapUpdates,inventory FROM shard where shardid=?");
    $rh = $sth->execute($shardID);
    my @array=$sth->fetchrow_array();
    print "BEGIN\n";
    print "Coords: $array[0],$array[1]\n";
    print "Time: $array[2]\n";
    print "Flags: $array[3]\n";
    print "MapUpdates: $array[4]\n";
    print "Inventory: $array[5]\n";
    print "Commence playing.\n";
}

my $shardID = getUserShard($userID);

if($shardID==0) {
    print "Either you don't exist, or you are not in a shard\n";
    exit(0);
}

touchTimeStamp($dbh,$userID);

my $shardStatus = getShardStatus($dbh,$shardID);
if($shardStatus==0 || $shardStatus==1) {
    my $currentUser = getShardUser($shardID);
    if($currentUser == $userID) {
        print "It is your turn to play.\n";
        sendStartupInfo($shardID);
    }
    else
    {
        print "It is not your turn to play yet; please poll again.\n";
    }
}
elsif($shardStatus==2) {
    print "Your shard won.\n";
}
elsif($shardStatus==3) {
    print "Your shard has died.\n";
}
