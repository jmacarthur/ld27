#!/usr/bin/perl
use CGI;
use Data::Dumper;
use DBI;

use utils;

open STDERR, ">>errors" if $ENV{SERVER_SOFTWARE} =~ m/^mini_httpd/;

my $dbh = DBI->connect("dbi:SQLite:../condition.sqlite","","");

my $sth = $dbh->prepare("INSERT INTO userids (shard) VALUES (0);");
my $rh = $sth->execute();
my $userID = $dbh->func('last_insert_rowid');
my $q = CGI->new;
print $q->header('text/plain');
print "USERID: $userID\n";
touchTimeStamp($dbh,$userID);

sub addUserToShard
{
    my($shardID, $userID) = @_;
    my $sth = $dbh->prepare("UPDATE userids SET shard=? WHERE userid=?");
    my $rh = $sth->execute($shardID, $userID) or warn "Couldn't add user to shard\n";

}

sub countUsersInShard
{
    my $shardID = shift;
    my $sth = $dbh->prepare("SELECT COUNT(userid) from userids where shard=?");
    my $rh = $sth->execute($shardID);
    my @array = $sth->fetchrow_array();
    if(@array > 0) {
        print "Found $array[0] users in shard.\n";
        return $array[0];
    }
    warn "Can't count users in shard '$shardID'\n";
}

sub setShardStatus
{
    my($shardID, $newStatus) = @_;
    my $sth = $dbh->prepare("UPDATE shard SET status=? WHERE shardid=?");
    my $rh = $sth->execute($newStatus,$shardID) or warn "Can't update shard $shardID status to $newStatus\n";

    print "Shard $shardID has been set to status $newStatus\n";
}


# I should also give you a shard ID. Either you find a shard with
# 2 people in it already, or you join a shard with not enough people,
# or make a new shard.

# Is there any shard with 2 people in it?
my $sth = $dbh->prepare("select shardid from shard where status=0;");
my $tuples = $sth->execute();
my @array = $sth->fetchrow_array();
my $shardID;
if(@array > 0) {
    $shardID = $array[0];
    addUserToShard($shardID, $userID);
    my $userCount = countUsersInShard($shardID);
    if($userCount >= 3) {
        setShardStatus($shardID, 1);
    }
    print "You join exisiting shard '$shardID', which now has $userCount users.\n";
}
else
{
    my $sth = $dbh->prepare("INSERT INTO shard (status,playerx,playery,time,mapUpdates) VALUES (0,64,64,0,'');");
    my $rh = $sth->execute();
    $shardID = $dbh->func('last_insert_rowid');
    print "You join new shard $shardID\n";
    addUserToShard($shardID, $userID);
    setShardUser($dbh, $shardID, $userID);
}

print "All done. Please poll shard $shardID\n";
print "SHARD: $shardID\n";
